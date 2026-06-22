import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ContentPlan {
  id: string;
  title: string;
  description: string;
  category: string;
  platform: string;
  scheduleDate: string; // YYYY-MM-DD
  status: 'Draft' | 'Scheduled' | 'Published';
  aiOutput?: string;
  promptUsed?: string;
  createdAt: string;
}

export interface AIPrompt {
  id: string;
  title: string;
  promptText: string;
  tags: string[];
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlannerService {
  private http = inject(HttpClient);

  // Core signals for state management
  private plansSignal = signal<ContentPlan[]>([]);
  private promptsSignal = signal<AIPrompt[]>([]);
  private isGeneratingSignal = signal<boolean>(false);

  // Expose read-only signals
  plans = computed(() => this.plansSignal());
  prompts = computed(() => this.promptsSignal());
  isGenerating = computed(() => this.isGeneratingSignal());

  // Quick Stats Signals
  totalPlans = computed(() => this.plansSignal().length);
  draftCount = computed(() => this.plansSignal().filter(p => p.status === 'Draft').length);
  scheduledCount = computed(() => this.plansSignal().filter(p => p.status === 'Scheduled').length);
  publishedCount = computed(() => this.plansSignal().filter(p => p.status === 'Published').length);

  constructor() {
    this.initData();
  }

  private initData() {
    if (typeof window === 'undefined') return;

    try {
      // 1. Load plans or pre-seed defaults
      const storedPlans = localStorage.getItem('ai_content_planner_plans');
      if (storedPlans) {
        this.plansSignal.set(JSON.parse(storedPlans));
      } else {
        const defaultPlans = this.getDefaultPlans();
        localStorage.setItem('ai_content_planner_plans', JSON.stringify(defaultPlans));
        this.plansSignal.set(defaultPlans);
      }

      // 2. Load Prompts or pre-seed defaults
      const storedPrompts = localStorage.getItem('ai_content_planner_prompts');
      if (storedPrompts) {
        this.promptsSignal.set(JSON.parse(storedPrompts));
      } else {
        const defaultPrompts = this.getDefaultPrompts();
        localStorage.setItem('ai_content_planner_prompts', JSON.stringify(defaultPrompts));
        this.promptsSignal.set(defaultPrompts);
      }
    } catch (e) {
      console.error('Error pre-seeding default content', e);
    }
  }

  // --- PLANS CRUD OPERATIONS ---

  addPlan(planData: Omit<ContentPlan, 'id' | 'createdAt'>): ContentPlan {
    const newPlan: ContentPlan = {
      ...planData,
      id: 'p_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };

    const updated = [newPlan, ...this.plansSignal()];
    this.savePlans(updated);
    return newPlan;
  }

  updatePlan(id: string, updates: Partial<Omit<ContentPlan, 'id' | 'createdAt'>>): ContentPlan | undefined {
    const plansCopy = [...this.plansSignal()];
    const index = plansCopy.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    const updatedPlan = {
      ...plansCopy[index],
      ...updates
    };
    plansCopy[index] = updatedPlan;
    this.savePlans(plansCopy);
    return updatedPlan;
  }

  deletePlan(id: string): boolean {
    const currentList = this.plansSignal();
    const filtered = currentList.filter(p => p.id !== id);
    if (filtered.length === currentList.length) return false;

    this.savePlans(filtered);
    return true;
  }

  getPlanById(id: string): ContentPlan | undefined {
    return this.plansSignal().find(p => p.id === id);
  }

  private savePlans(plans: ContentPlan[]) {
    this.plansSignal.set(plans);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ai_content_planner_plans', JSON.stringify(plans));
      } catch (e) {
        console.error('Failed to write plans to localStorage', e);
      }
    }
  }

  // --- AI PROMPT LIBRARY CRUD OPERATIONS ---

  addPrompt(promptData: Omit<AIPrompt, 'id'>): AIPrompt {
    const newPrompt: AIPrompt = {
      ...promptData,
      id: 'pr_' + Math.random().toString(36).substr(2, 9),
    };

    const updated = [newPrompt, ...this.promptsSignal()];
    this.savePrompts(updated);
    return newPrompt;
  }

  updatePrompt(id: string, updates: Partial<Omit<AIPrompt, 'id'>>): AIPrompt | undefined {
    const promptsCopy = [...this.promptsSignal()];
    const index = promptsCopy.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    const updatedPrompt = {
      ...promptsCopy[index],
      ...updates
    };
    promptsCopy[index] = updatedPrompt;
    this.savePrompts(promptsCopy);
    return updatedPrompt;
  }

  deletePrompt(id: string): boolean {
    const currentList = this.promptsSignal();
    const filtered = currentList.filter(p => p.id !== id);
    if (filtered.length === currentList.length) return false;

    this.savePrompts(filtered);
    return true;
  }

  private savePrompts(p: AIPrompt[]) {
    this.promptsSignal.set(p);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ai_content_planner_prompts', JSON.stringify(p));
      } catch (e) {
        console.error('Failed to write prompts to localStorage', e);
      }
    }
  }

  // --- SERVER-SIDE GEMINI API CONNECTIONS ---

  async generateAICaption(prompt: string, category: string, platform: string, tone = 'Inspirational'): Promise<string> {
    this.isGeneratingSignal.set(true);
    try {
      const response = await firstValueFrom<{ text: string }>(
        this.http.post<{ text: string }>('/api/generate-content', {
          prompt,
          category,
          platform,
          tone
        })
      );
      this.isGeneratingSignal.set(false);
      return response.text || 'No response rendered by AI.';
    } catch (e) {
      this.isGeneratingSignal.set(false);
      console.error('Failed generating draft caption via express API:', e);
      const httpError = e as { error?: { error?: string }; message?: string };
      const errMessage = httpError.error?.error || httpError.message || 'Server error';
      throw new Error(`AI Generation Service Error: ${errMessage}`);
    }
  }

  // --- SEEDING METHOD UTILITIES ---

  private getDefaultPlans(): ContentPlan[] {
    const today = new Date();
    
    const formatDate = (daysOffset: number): string => {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysOffset);
      return targetDate.toISOString().split('T')[0];
    };

    return [
      {
        id: 'p_1',
        title: 'Modern Core Web Vitals Optimization',
        description: 'Publishing a comprehensive breakdown of the new INP (Interaction to Next Paint) metric and strategies to achieve a gold score in 2026.',
        category: 'Blog',
        platform: 'Medium / Personal Blog',
        scheduleDate: formatDate(2), // 2 days in future
        status: 'Scheduled',
        createdAt: new Date().toISOString(),
        promptUsed: 'Write a comprehensive guide outline for INP optimizations.',
        aiOutput: `### TITLE: Achieving Pristine INP Scores in 2026: A Developer's Practical Guide

### COMPLETE POST BODY:
With Interaction to Next Paint (INP) fully cementing itself as the core responsiveness metric, maintaining a sub-200ms score is mandatory. Modern SPA routing can bloat interaction latencies. Here is our master draft covering key areas:

1. **Leverage Isomorphic Hydration & Rehydration**: Minimize main-thread locking during high-interactivity periods.
2. **Break Up Long Tasks with requestIdleCallback**: Offload computational scripts (analytics, complex filters) using lightweight yield blocks.
3. **Optimistic UI Updates through Transition Handlers**: Update visual cues instantaneously instead of holding UI threads captive until promises finalize.

Read the fully compiled post inside our newsletter! #WebPerformance #ModernWeb #GoogleLighthouse #TechnicalSEO`
      },
      {
        id: 'p_2',
        title: 'Launch Day - AI Content Planner Product Reveal',
        description: 'Post detailed design graphics showing the calendar views and prompt integration alongside a product walkthrough video.',
        category: 'Social Media',
        platform: 'Instagram',
        scheduleDate: formatDate(0), // Today
        status: 'Draft',
        createdAt: new Date().toISOString(),
        promptUsed: 'Write clean launch day post copies.',
        aiOutput: `### TITLE: Design Harmony Meets Autonomous Content Orchestration

### COMPLETE POST BODY:
Say hello to the **AI Content Planner**! 🌟 We designed this app with one goal in mind: helping you plan, schedule, and co-author content side-by-side with Gemini, right from a unified single calendar grid space.

- ✨ Clean aesthetic layout
- 📅 Fully functional visual planning calendar
- 📂 Standardized Prompt Library with tag filtering
- 🤖 Direct server-side fast Gemini generative preview

We'd love to hear your feedback! Tap the link in your bio to run your first planner build!
#SaaS #UIUX #AngularDeveloper #ProductivityHack`
      },
      {
        id: 'p_3',
        title: 'Micro-Interactions in Frontend Engineering',
        description: 'A structured slide-deck post discussing how micro-interactions (stagger animations, subtle page ripples) elevate SaaS conversions.',
        category: 'Ads',
        platform: 'LinkedIn',
        scheduleDate: formatDate(-3), // 3 days in past
        status: 'Published',
        createdAt: new Date().toISOString(),
        promptUsed: 'None',
        aiOutput: '### TITLE: Elevating Product Integrity via Tactile Feedback\n\n### COMPLETE POST BODY:\nWhy do some SaaS dashboards feel professional and expensive, while others feel clinical and robotic? The differentiator is often **tactile micro-interactions**.\n\nGreat interaction cues direct attention without generating visual clutter. Highly satisfied users lead to sustainable retention margins. Check out our detailed design spec document!'
      },
      {
        id: 'p_4',
        title: 'Why We Built Workspace OAuth directly into SPAs',
        description: 'Educational explainer post explaining standard workspace API limits and security profiles inside sandboxed frames.',
        category: 'Blog',
        platform: 'Twitter / X',
        scheduleDate: formatDate(5), // 5 days in future
        status: 'Scheduled',
        createdAt: new Date().toISOString()
      }
    ];
  }

  private getDefaultPrompts(): AIPrompt[] {
    return [
      {
        id: 'pr_1',
        title: 'Engaging Hooks Architect',
        promptText: 'Write 5 distinct and intriguing hook variations about [Topic]. Make sure to leverage curiosity loops, bold statistics, or contrarian beliefs.',
        category: 'Social Media',
        tags: ['Hooks', 'Marketing', 'Twitter']
      },
      {
        id: 'pr_2',
        title: 'SaaS Carousel Outliner',
        promptText: 'Produce a detailed breakdown for an Instagram slide deck consisting of 7 slides about [Concept]. Each slide should state the core title, body copy limit (100 characters max), and illustrative recommendation details.',
        category: 'Social Media',
        tags: ['Instagram', 'SaaS', 'Carousel']
      },
      {
        id: 'pr_3',
        title: 'Standard SEO Structure Architect',
        promptText: 'Draft a standard structural skeleton for a technical blog post regarding [Technology]. Include 4 main subheaders (H2), introduction criteria, a list of potential code tags, and 3 strategic FAQ queries.',
        category: 'Blog',
        tags: ['SEO', 'Blogging', 'Developer-Marketing']
      },
      {
        id: 'pr_4',
        title: 'LinkedIn Thought-Leadership Pivot',
        promptText: 'Draft an educational career reflection covering [Lesson Learned]. Format it for LinkedIn with generous vertical line breaks, professional bullet keys, and close with a thought-provoking conversational question.',
        category: 'Ads',
        tags: ['LinkedIn', 'Branding']
      }
    ];
  }
}
