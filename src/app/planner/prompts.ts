import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlannerService, AIPrompt } from './planner.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-prompts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div id="prompts-wrapper" class="p-3 sm:p-5 lg:p-8 space-y-5 sm:space-y-7 max-w-7xl mx-auto animate-fade-in select-none">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5.5">
        <div class="min-w-0">
          <h1 class="text-2xl md:text-2xl font-display font-semibold text-slate-950 tracking-tight">AI Prompt Library</h1>
          <p class="text-xs text-slate-400 mt-1 font-sans">Store, tag, and customize writing templates. These inject directly into your content planner drafts.</p>
        </div>
        <div class="shrink-0">
          <button 
            (click)="openAddModal()" 
            class="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium font-sans rounded-xl text-xs whitespace-nowrap transition-all shadow-md shadow-slate-950/10 cursor-pointer"
          >
            <mat-icon class="scale-90 text-[18px] w-[18px] h-[18px]">add</mat-icon>
            <span>Create New Template</span>
          </button>
        </div>
      </div>

      <!-- Filters Panel (Signals Bound - No ngModel) -->
      <div class="bg-white border border-slate-200/60 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <!-- Search Input -->
        <div class="flex-1 relative">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <mat-icon class="text-[18px]">search</mat-icon>
          </span>
          <input 
            type="text" 
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            placeholder="Search prompt titles, tags or core directives..." 
            class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 text-xs rounded-xl transition-all font-sans"
          />
        </div>

        <!-- Category Selector -->
        <div class="w-full sm:w-60">
          <select 
            [value]="filterCategory()" 
            (change)="onCategoryChange($event)"
            class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 text-xs rounded-xl cursor-pointer font-sans transition-all text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="SaaS & Marketing">SaaS & Marketing</option>
            <option value="Educational & Guides">Educational & Guides</option>
            <option value="Teasers & Hooks">Teasers & Hooks</option>
            <option value="LinkedIn Focus">LinkedIn Focus</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
        </div>
      </div>

      <!-- Prompt Bento Grid -->
      @if (filteredPrompts().length === 0) {
        <div class="p-8 sm:p-16 bg-white border border-slate-200/60 rounded-2xl text-center text-slate-400 animate-fade-in select-none">
          <mat-icon class="text-slate-300 scale-125 mb-3 h-10 w-10 flex items-center justify-center mx-auto">settings_suggest</mat-icon>
          <h3 class="text-xs font-semibold text-slate-800">No prompt templates found</h3>
          <p class="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">Create a customized prompt or dial down your filters to reuse templates in writing operations.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          @for (prompt of filteredPrompts(); track prompt.id) {
            <div class="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm md:hover:border-slate-350 transition-all flex flex-col justify-between space-y-4">
              
              <!-- Content Info -->
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <!-- Category Badge -->
                  <span class="inline-flex px-2 py-0.5 text-[9px] font-bold text-slate-750 bg-slate-100 rounded-lg font-mono border border-slate-200/40 uppercase">
                    {{ prompt.category }}
                  </span>
                  <!-- Quick actions -->
                  <div class="flex items-center gap-1 select-none">
                    <button 
                      (click)="onCopy(prompt.promptText)" 
                      class="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-150 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer transition-colors"
                      title="Copy Prompt Directives"
                    >
                      <mat-icon class="text-sm scale-90">content_copy</mat-icon>
                    </button>
                    <button 
                      (click)="openEditModal(prompt)" 
                      class="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-150 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer transition-colors"
                      title="Edit Prompt"
                    >
                      <mat-icon class="text-sm scale-90">edit</mat-icon>
                    </button>
                    <button 
                      (click)="onDelete(prompt.id)" 
                      class="p-1.5 hover:bg-red-50 border border-transparent hover:border-red-150 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                      title="Delete Prompt"
                    >
                      <mat-icon class="text-sm scale-90">delete</mat-icon>
                    </button>
                  </div>
                </div>

                <h3 class="text-sm font-semibold text-slate-900 leading-snug">{{ prompt.title }}</h3>
                
                <!-- Prompt preview block -->
                <div class="p-3 bg-slate-55 border border-slate-100 text-[11px] font-mono rounded-xl text-slate-500 overflow-x-hidden leading-relaxed max-h-32 overflow-y-auto">
                  {{ prompt.promptText }}
                </div>
              </div>

              <!-- Tags / Chips List -->
              @if (prompt.tags && prompt.tags.length > 0) {
                <div class="flex flex-wrap gap-1 border-t border-slate-100 pt-3 select-none">
                  @for (tag of prompt.tags; track tag) {
                    <span class="inline-flex items-center text-[9px] bg-slate-50 text-slate-500 border border-slate-150/50 px-2 py-0.5 rounded-lg font-semibold font-mono leading-none">
                      #{{ tag }}
                    </span>
                  }
                </div>
              }

            </div>
          }
        </div>
      }

      <!-- CREATE/EDIT PROMPT MODAL -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 bg-slate-950/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in select-none">
          <div class="bg-white rounded-xl sm:rounded-2xl w-full max-w-lg max-h-[calc(100dvh-1rem)] border border-slate-200/60 shadow-2xl animate-scale-up overflow-y-auto flex flex-col">
            
            <!-- Header -->
            <div class="px-4 sm:px-5 py-4 bg-slate-50/50 border-b border-slate-150/50 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-base font-display font-semibold text-slate-900">
                  {{ isEditMode() ? 'Edit Prompt Template' : 'Add Prompt Template' }}
                </h3>
                <p class="text-[10px] text-slate-400 font-sans">Define context placeholders to auto substitute topic values.</p>
              </div>
              <button (click)="closeModal()" class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200/50">
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <!-- Form -->
            <form [formGroup]="promptForm" (ngSubmit)="savePrompt()" class="p-4 sm:p-5 space-y-4 bg-white text-xs">
              
              <!-- Title -->
              <div>
                <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Template Name</span>
                <input 
                  type="text" 
                  formControlName="title"
                  placeholder="e.g. Viral Hook Architect" 
                  class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/60 focus:bg-white rounded-xl text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all font-sans"
                />
                @if (promptForm.get('title')?.touched && promptForm.get('title')?.invalid) {
                  <p class="text-[10px] text-red-500 mt-1">Please provide a descriptive template title.</p>
                }
              </div>

              <!-- Category -->
              <div>
                <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Library Category</span>
                <select 
                  formControlName="category"
                  class="w-full bg-slate-50 border border-slate-200/60 px-2.5 py-2 rounded-xl text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 cursor-pointer font-sans transition-colors text-slate-700"
                >
                  <option value="SaaS & Marketing">SaaS & Marketing</option>
                  <option value="Educational & Guides">Educational & Guides</option>
                  <option value="Teasers & Hooks">Teasers & Hooks</option>
                  <option value="LinkedIn Focus">LinkedIn Focus</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <!-- Directive Instructions -->
              <div>
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                  <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Prompt Directives</span>
                  <span class="text-[9px] text-slate-400 font-sans">Use <strong>[Topic]</strong> as placeholder fallback</span>
                </div>
                <textarea 
                  rows="5"
                  formControlName="promptText"
                  placeholder="e.g. You are an expert marketer. Write 3 alternative attention-grabbing email headers talk about [Topic] to developers." 
                  class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 focus:bg-white rounded-xl text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all resize-none leading-relaxed font-mono text-slate-705"
                ></textarea>
                @if (promptForm.get('promptText')?.touched && promptForm.get('promptText')?.invalid) {
                  <p class="text-[10px] text-red-500 mt-1">Directive instructions cannot be left blank.</p>
                }
              </div>

              <!-- Tags/Chips (Comma separated) -->
              <div>
                <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Tags (Comma-separated list)</span>
                <input 
                  type="text" 
                  formControlName="tagsInput"
                  placeholder="e.g. hook, viral, twitter, web3" 
                  class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/60 focus:bg-white rounded-xl text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all font-sans"
                />
                <p class="text-[10px] text-slate-405 mt-1 font-sans">Separate keywords with commas (e.g. SaaS, guide, tech).</p>
              </div>

              <!-- Controls -->
              <div class="grid grid-cols-2 sm:flex sm:justify-end gap-2 pt-4.5 border-t border-slate-150">
                <button 
                  type="button" 
                  (click)="closeModal()" 
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-650 font-sans cursor-pointer transition-colors"
                >Cancel</button>
                <button 
                  type="submit" 
                  [disabled]="promptForm.invalid"
                  class="px-5 py-2 bg-slate-900 border border-slate-950 hover:bg-slate-800 rounded-xl font-semibold text-white shadow-md shadow-slate-950/10 cursor-pointer transition-colors"
                >Save Template</button>
              </div>

            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class Prompts {
  fb = inject(FormBuilder);
  tracker = inject(PlannerService);

  // Filters using Signals
  searchQuery = signal('');
  filterCategory = signal('');

  // Sorted prompts
  filteredPrompts = signal<AIPrompt[]>([]);

  // Modals signals
  isModalOpen = signal(false);
  isEditMode = signal(false);
  activePromptId: string | null = null;
  promptForm!: FormGroup;

  constructor() {
    this.initForm();
    this.refreshPrompts();

    // Re-trigger whenever service prompts or filter signals change
    effect(() => {
      this.refreshPrompts();
    });
  }

  initForm() {
    this.promptForm = this.fb.group({
      title: ['', Validators.required],
      category: ['SaaS & Marketing', Validators.required],
      promptText: ['', Validators.required],
      tagsInput: ['']
    });
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  onCategoryChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.filterCategory.set(val);
  }

  refreshPrompts() {
    let list = this.tracker.prompts();

    // Apply Search
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.promptText.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Apply Category
    const cat = this.filterCategory();
    if (cat) {
      list = list.filter(p => p.category === cat);
    }

    this.filteredPrompts.set(list);
  }

  // COPY DIRECTIVES
  onCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Prompt directives successfully copied to clipboard!');
    }).catch(() => {
      alert('Could not copy automatically. Please select text manually.');
    });
  }

  // DELETE
  onDelete(id: string) {
    if (confirm('Are you absolutely sure you want to remove this prompt template from your library? Content plans referencing it will remain untouched.')) {
      this.tracker.deletePrompt(id);
      this.refreshPrompts();
    }
  }

  // ADD PROMPT
  openAddModal() {
    this.isEditMode.set(false);
    this.activePromptId = null;
    this.initForm();
    this.isModalOpen.set(true);
  }

  // EDIT PROMPT
  openEditModal(prompt: AIPrompt) {
    this.isEditMode.set(true);
    this.activePromptId = prompt.id;
    
    this.promptForm.patchValue({
      title: prompt.title,
      category: prompt.category,
      promptText: prompt.promptText,
      tagsInput: prompt.tags.join(', ')
    });

    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  savePrompt() {
    if (this.promptForm.invalid) {
      return;
    }

    const { title, category, promptText, tagsInput } = this.promptForm.value;
    
    // Parse tags list
    const tags = tagsInput
      ? tagsInput.split(',')
                 .map((t: string) => t.trim())
                 .filter((t: string) => t.length > 0)
      : [];

    const promptPayload = { title, category, promptText, tags };

    if (this.isEditMode() && this.activePromptId) {
      this.tracker.updatePrompt(this.activePromptId, promptPayload);
    } else {
      this.tracker.addPrompt(promptPayload);
    }

    this.closeModal();
    this.refreshPrompts();
  }
}
