import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlannerService, ContentPlan } from './planner.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div id="dashboard-wrapper" class="p-3 sm:p-5 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto animate-fade-in font-sans">
      
      <!-- Welcome Header -->
      <div id="welcome-header" class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl lg:text-3.5xl font-display font-semibold text-slate-900 tracking-tight">Content Pipeline Hub</h1>
          <p class="text-sm text-slate-500 mt-1 font-sans">Draft, schedule, and orchestrate all digital marketing content seamlessly. Empowered by server-side Gemini AI.</p>
        </div>
        <div class="shrink-0">
          <button 
            id="btn-create-modal"
            (click)="openCreateModal()" 
            class="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium font-display rounded-xl text-sm whitespace-nowrap shadow-md shadow-slate-950/15 group transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <mat-icon class="scale-90 transition-transform group-hover:rotate-90">add</mat-icon>
            <span>Draft New Post</span>
          </button>
        </div>
      </div>

      <!-- Quick Stats Cards Section -->
      <div id="stats-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 select-none">
        
        <!-- Total Plans -->
        <div class="p-4 sm:p-5 bg-white border border-slate-200/50 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none">Total Assets</span>
            <span class="w-8.5 h-8.5 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100">
              <mat-icon class="scale-90">layers</mat-icon>
            </span>
          </div>
          <div class="text-3xl font-display font-semibold text-slate-900 leading-none">{{ tracker.totalPlans() }}</div>
          <p class="text-[10px] text-slate-400 mt-2 font-medium font-mono">Registered pipeline items</p>
        </div>

        <!-- Drafts -->
        <div class="p-4 sm:p-5 bg-white border border-slate-200/50 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-amber-600 uppercase tracking-widest leading-none">Drafts</span>
            <span class="w-8.5 h-8.5 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50">
              <mat-icon class="scale-90">edit_note</mat-icon>
            </span>
          </div>
          <div class="text-3xl font-display font-semibold text-slate-900 leading-none">{{ tracker.draftCount() }}</div>
          <p class="text-[10px] text-slate-400 mt-2 font-medium font-mono">Unfinished concepts</p>
        </div>

        <!-- Scheduled -->
        <div class="p-4 sm:p-5 bg-white border border-slate-200/50 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-indigo-600 uppercase tracking-widest leading-none">Scheduled</span>
            <span class="w-8.5 h-8.5 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50">
              <mat-icon class="scale-90">schedule_send</mat-icon>
            </span>
          </div>
          <div class="text-3xl font-display font-semibold text-slate-900 leading-none">{{ tracker.scheduledCount() }}</div>
          <p class="text-[10px] text-slate-400 mt-2 font-medium font-mono">Auto schedule plans</p>
        </div>

        <!-- Published -->
        <div class="p-4 sm:p-5 bg-white border border-slate-200/50 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-emerald-600 uppercase tracking-widest leading-none">Published</span>
            <span class="w-8.5 h-8.5 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
              <mat-icon class="scale-90">check_circle_outline</mat-icon>
            </span>
          </div>
          <div class="text-3xl font-display font-semibold text-slate-900 leading-none">{{ tracker.publishedCount() }}</div>
          <p class="text-[10px] text-slate-400 mt-2 font-medium font-mono">Active in live feeds</p>
        </div>
      </div>

      <!-- Controls: Filters and Search (Using Pure Reactive Signal Binding) -->
      <div id="filters-container" class="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center">
        <!-- Search -->
        <div class="flex-1 relative">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <mat-icon class="text-[18px]">search</mat-icon>
          </span>
          <input 
            id="input-search"
            type="text" 
            [value]="searchQuery()" 
            (input)="onSearchInput($event)"
            placeholder="Search plans by title or key phrases..." 
            class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 text-sm rounded-xl transition-all"
          />
        </div>
        
        <!-- Category Filter -->
        <div class="w-full md:w-52">
          <select 
            id="select-filter-category"
            [value]="filterCategory()" 
            (change)="onCategoryChange($event)"
            class="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 text-sm rounded-xl cursor-pointer transition-colors"
          >
            <option value="">All Categories</option>
            <option value="Social Media">Social Media</option>
            <option value="Blog">Blog</option>
            <option value="Ads">Ads</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="w-full md:w-52">
          <select 
            id="select-filter-status"
            [value]="filterStatus()" 
            (change)="onStatusChange($event)"
            class="w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 text-sm rounded-xl cursor-pointer transition-all"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Published">Published</option>
          </select>
        </div>
      </div>

      <!-- Main Contents Split/List Panel -->
      <div id="content-display-panel" class="bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden">
        
        <!-- Table Header / Title Actions -->
        <div class="px-4 sm:px-6 py-4 border-b border-slate-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 bg-slate-50/40">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Pipeline Schedule Items</h2>
          <span class="text-xs text-slate-400 font-medium font-mono">Found {{ filteredPlans().length }} assets</span>
        </div>

        @if (filteredPlans().length === 0) {
          <!-- Empty State -->
          <div class="p-8 sm:p-16 text-center text-slate-500 select-none animate-fade-in bg-white">
            <mat-icon class="text-slate-200 scale-125 mb-3 h-10 w-10 flex items-center justify-center mx-auto">space_dashboard</mat-icon>
            <h3 class="text-sm font-display font-semibold text-slate-700">No scheduled content plans found</h3>
            <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Formulate a new plan or adjust your query conditions above to inspect alternate entries.</p>
          </div>
        } @else {
          <!-- Table/List -->
          <div class="divide-y divide-slate-100 divide-dashed bg-white">
            @for (plan of filteredPlans(); track plan.id) {
              <div class="p-4 sm:p-5.5 transition-colors hover:bg-slate-50/60 flex flex-col xl:flex-row xl:items-center justify-between gap-5 sm:gap-6">
                
                <!-- Info Section -->
                <div class="flex-1 min-w-0 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <!-- Platform badge -->
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200/60 rounded-xl text-[10px] font-semibold uppercase font-mono tracking-wide">
                      <mat-icon class="text-[13px] w-3.5 h-3.5 flex items-center justify-center">cell_tower</mat-icon>
                      {{ plan.platform }}
                    </span>
                    <!-- Category Badge -->
                    <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100/50 px-2.5 py-1 rounded-xl">
                      {{ plan.category }}
                    </span>
                    <!-- Status Badge -->
                    @switch (plan.status) {
                      @case ('Draft') {
                        <span class="px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 rounded-xl border border-amber-100/60">Draft</span>
                      }
                      @case ('Scheduled') {
                        <span class="px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 rounded-xl border border-indigo-100/60">Scheduled</span>
                      }
                      @case ('Published') {
                        <span class="px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100/60">Published</span>
                      }
                    }
                  </div>

                  <button type="button" (click)="openDetailModal(plan)" class="text-left w-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900/10 rounded-lg block">
                    <h3 class="text-base font-display font-medium text-slate-900 leading-snug hover:text-slate-800 hover:underline transition-colors">
                      {{ plan.title }}
                    </h3>
                  </button>
                  
                  <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
                    {{ plan.description }}
                  </p>

                  <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[11px] font-mono text-slate-400">
                    <span class="flex items-center gap-1 text-slate-500">
                      <mat-icon class="text-xs text-slate-400 scale-90">calendar_today</mat-icon>
                      Schedule: {{ plan.scheduleDate }}
                    </span>
                    @if (plan.aiOutput) {
                      <span class="flex items-center gap-0.5 text-indigo-600 font-semibold font-mono">
                        <mat-icon class="text-xs scale-90">bolt</mat-icon>
                        AI copies loaded
                      </span>
                    }
                  </div>
                </div>

                <!-- Fast CTA Action Options -->
                <div class="flex w-full xl:w-auto shrink-0 gap-2 items-center select-none">
                  <button 
                    (click)="openDetailModal(plan)" 
                    class="flex-1 xl:flex-none p-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 font-medium rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer h-8.5"
                    title="View Details"
                  >
                    <mat-icon class="text-xs scale-90">visibility</mat-icon>
                    <span class="font-display">View</span>
                  </button>
                  <button 
                    (click)="openEditModal(plan)" 
                    class="flex-1 xl:flex-none p-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 font-medium rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer h-8.5"
                    title="Edit Plan"
                  >
                    <mat-icon class="text-xs scale-90">edit</mat-icon>
                    <span class="font-display">Edit</span>
                  </button>
                  <button 
                    (click)="onDelete(plan.id)" 
                    class="w-8.5 h-8.5 border border-slate-200/40 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                    title="Delete Plan"
                  >
                    <mat-icon class="text-[16px] w-4 h-4 flex items-center leading-none justify-center">delete</mat-icon>
                  </button>
                </div>

              </div>
            }
          </div>
        }
      </div>

      <!-- MASTER MODAL: CREATE AND EDIT CONTENT PLAN -->
      @if (isFormOpen()) {
        <div class="fixed inset-0 bg-slate-950/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto animate-fade-in select-none">
          <div class="bg-white rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[calc(100dvh-1rem)] sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/60 shadow-2xl animate-scale-up">
            
            <!-- Modal Header -->
            <div class="px-4 sm:px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-base font-display font-semibold text-slate-900 tracking-tight">
                  {{ isEditMode() ? 'Edit Scheduled Assignment' : 'Draft New Publication Concept' }}
                </h3>
                <p class="text-[11px] text-slate-400 font-sans">Initialize target vectors, specify dates, and trigger Gemini AI to write captions.</p>
              </div>
              <button (click)="closeFormModal()" class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200/50">
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <!-- Modal Content (Scrollable Grid Split: Left Form, Right AI Panel) -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 bg-white">
              
              <!-- Form Block (7 Columns) -->
              <form [formGroup]="planForm" class="lg:col-span-7 space-y-4">
                <!-- Title -->
                <div>
                  <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Asset Headline / Title</span>
                  <input 
                    type="text" 
                    formControlName="title"
                    placeholder="e.g. YouTube Tutorial: Angular SSR Setup" 
                    class="w-full px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all font-sans"
                  />
                  @if (planForm.get('title')?.touched && planForm.get('title')?.invalid) {
                    <p class="text-[11px] text-red-500 mt-1">Please provide an expressive headline title.</p>
                  }
                </div>

                <!-- Description/Theme -->
                <div>
                  <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Context / Purpose Details</span>
                  <textarea 
                    rows="3"
                    formControlName="description"
                    placeholder="Provide a general summary of ideas or lessons that you intend to deliver inside this content piece..." 
                    class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all resize-none leading-relaxed font-sans"
                  ></textarea>
                </div>

                <!-- Category & Platform Split Row -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Category -->
                  <div>
                    <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Category Channel</span>
                    <select 
                      formControlName="category"
                      class="w-full px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all cursor-pointer font-sans"
                    >
                      <option value="Social Media">Social Media</option>
                      <option value="Blog">Blog</option>
                      <option value="Ads">Ads</option>
                    </select>
                  </div>

                  <!-- Platform -->
                  <div>
                    <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Target Platform</span>
                    <select 
                      formControlName="platform"
                      class="w-full px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all cursor-pointer font-sans"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Twitter / X">Twitter / X</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Facebook / Meta">Facebook / Meta</option>
                      <option value="Medium / Personal Blog">Medium / Personal Blog</option>
                      <option value="Other Channels">Other Channels</option>
                    </select>
                  </div>
                </div>

                <!-- Date & Status Split Row -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Schedule Date -->
                  <div>
                    <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Calendar Date</span>
                    <input 
                      type="date" 
                      formControlName="scheduleDate"
                      class="w-full px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all cursor-pointer font-mono"
                    />
                  </div>

                  <!-- Status -->
                  <div>
                    <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Workflow Status</span>
                    <select 
                      formControlName="status"
                      class="w-full px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition-all cursor-pointer font-semibold font-sans"
                      [class.text-amber-600]="planForm.get('status')?.value === 'Draft'"
                      [class.text-indigo-600]="planForm.get('status')?.value === 'Scheduled'"
                      [class.text-emerald-700]="planForm.get('status')?.value === 'Published'"
                    >
                      <option value="Draft">Draft (Offline Concept)</option>
                      <option value="Scheduled">Scheduled (Auto Approved)</option>
                      <option value="Published">Published (Live Online)</option>
                    </select>
                  </div>
                </div>

                <!-- Form Output Content Preview / Editing -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Draft Content copies / body Outline</span>
                    @if (planForm.get('aiOutput')?.value) {
                      <button 
                        type="button" 
                        (click)="clearBodyOutput()"
                        class="text-[10px] text-red-500 hover:underline cursor-pointer font-medium"
                      >Clear Text</button>
                    }
                  </div>
                  <textarea 
                    rows="6"
                    formControlName="aiOutput"
                    placeholder="Directly input text, or summon Gemini AI on the right side panel using any of your saved templates to generate structured outlines and hashtags automatically." 
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 font-sans transition-all resize-none leading-relaxed"
                  ></textarea>
                </div>
              </form>

              <!-- Gemini AI Content Assistant Panel (5 Columns - No ngModel!) -->
              <div class="lg:col-span-5 bg-slate-50/50 border border-slate-200/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                <div class="space-y-4">
                  <div class="flex items-center gap-2.5 mb-3 select-none">
                    <span class="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                      <mat-icon class="text-sm">bolt</mat-icon>
                    </span>
                    <div>
                      <h4 class="text-xs font-display font-semibold text-slate-950 leading-none">Gemini Co-Writer</h4>
                      <p class="text-[9px] text-slate-450 font-mono tracking-wider mt-1 uppercase">gemini-3.5-flash</p>
                    </div>
                  </div>

                  <!-- Saved Prompts Picker -->
                  <div>
                    <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 select-none font-mono">Template Library</span>
                    <select 
                      id="select-ai-prompt"
                      [value]="selectedTemplateId()" 
                      (change)="onTemplateChange($event)"
                      class="w-full bg-white border border-slate-200/60 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-slate-800 cursor-pointer text-slate-600 transition-colors font-sans"
                    >
                      <option value="">-- Choose custom saved template --</option>
                      @for (p of prompts(); track p.id) {
                        <option [value]="p.id">{{ p.title }} ({{ p.category }})</option>
                      }
                    </select>
                  </div>

                  <!-- Prompt Body Text Area -->
                  <div>
                    <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 select-none font-mono">Creative Prompt Directive</span>
                    <textarea 
                      id="textarea-ai-prompt"
                      rows="4" 
                      [value]="aiPromptText()" 
                      (input)="onPromptTextInput($event)"
                      placeholder="e.g. Write an amazing teaser post outline talking about Web performance INP."
                      class="w-full bg-white border border-slate-200/60 p-2.5 text-xs rounded-xl focus:outline-none focus:border-slate-800 h-28 resize-none leading-relaxed text-slate-700 font-sans"
                    ></textarea>
                  </div>

                  <!-- Tone Selector -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                    <div>
                      <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 select-none font-mono">Tone Choice</span>
                      <select 
                        id="select-ai-tone"
                        [value]="selectedTone()" 
                        (change)="onToneChange($event)"
                        class="w-full bg-white border border-slate-200/60 px-2 py-1.5 text-[11px] rounded-lg cursor-pointer text-slate-600 transition-colors font-sans font-medium"
                      >
                        <option value="Professional & Engaging">Professional</option>
                        <option value="Educational & Helpful font-sans">Educational</option>
                        <option value="Breezy & Relatable">Breezy/Viral</option>
                        <option value="Teasing & High Intrigue">Intriguing Teaser</option>
                        <option value="Bold & Contrarian">Contrarian Thought</option>
                      </select>
                    </div>
                    <div>
                      <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 select-none font-mono">Channel Constraint</span>
                      <input 
                        type="text" 
                        [value]="planForm.get('platform')?.value" 
                        disabled
                        class="w-full bg-slate-100/80 border border-slate-200/40 px-2.5 py-1.5 text-[11px] rounded-lg text-slate-400 cursor-not-allowed font-medium font-sans"
                      />
                    </div>
                  </div>

                  <!-- Call AI Button -->
                  <button 
                    id="btn-ai-generate"
                    type="button"
                    (click)="triggerAIGenerate()"
                    [disabled]="tracker.isGenerating() || !aiPromptText().trim()"
                    class="w-full py-2.5 bg-slate-900 border border-slate-950 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed text-white text-xs font-semibold font-display rounded-xl shadow-md shadow-slate-950/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    @if (tracker.isGenerating()) {
                      <div class="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      <span>Gemini is composing...</span>
                    } @else {
                      <mat-icon class="text-sm scale-90">bolt</mat-icon>
                      <span>Execute AI Generation</span>
                    }
                  </button>
                </div>

                <!-- AI Output Preview & Apply -->
                @if (aiGenerationResult()) {
                  <div class="border border-slate-200 bg-white rounded-xl p-3 max-h-48 overflow-y-auto flex flex-col space-y-2 mt-4 select-none animate-slide-up">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span class="text-[9px] font-bold text-slate-700 uppercase tracking-wider font-mono">Gemini Draft Preview</span>
                      <button 
                        id="btn-ai-apply"
                        (click)="applyAIEffectText()" 
                        class="text-[10px] text-slate-800 hover:text-white font-medium bg-slate-50 hover:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/60 cursor-pointer shadow-xs transition-colors"
                      >Apply to Post</button>
                    </div>
                    <pre class="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed font-sans overflow-x-hidden">{{ aiGenerationResult() }}</pre>
                  </div>
                } @else if (tracker.isGenerating()) {
                  <div class="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 animate-pulse bg-white flex flex-col items-center justify-center py-10 mt-4 h-48 select-none">
                    <mat-icon class="animate-spin text-slate-700 scale-125 mb-2">hourglass_empty</mat-icon>
                    <p class="text-xs font-semibold text-slate-700">Generating copies from backend...</p>
                    <p class="text-[9px] text-slate-400 mt-0.5 font-mono">Contacting server & invoking gemini-3.5-flash.</p>
                  </div>
                } @else {
                  <div class="border border-dashed border-slate-200/65 bg-white rounded-xl p-4 text-center text-slate-400 select-none text-[10px] py-9 mt-4 font-sans leading-relaxed">
                    Choose a template schema above, write creative guidelines, and hit "Execute AI Generation" to compose your text preview.
                  </div>
                }

              </div>
            </div>

            <!-- Modal Footer Controls -->
            <div class="px-4 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <span class="text-xs text-slate-400 font-medium select-none font-sans">Verify post credentials prior to schedule dispatch.</span>
              <div class="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                <button 
                  id="btn-cancel-modal"
                  type="button" 
                  (click)="closeFormModal()" 
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >Cancel</button>
                <button 
                  id="btn-save-modal"
                  type="button" 
                  (click)="savePlan()" 
                  [disabled]="planForm.invalid"
                  class="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >Save Schedule Plan</button>
              </div>
            </div>

          </div>
        </div>
      }

      <!-- MASTER MODAL: READ/DETAILS DETAIL MODAL -->
      @if (isDetailOpen() && activeDetailPlan()) {
        <div class="fixed inset-0 bg-slate-950/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in select-none">
          <div class="bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl border border-slate-200/60 shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[85vh]">
            
            <!-- Detail Header -->
            <div class="px-4 sm:px-6 py-4 border-b border-slate-200/50 bg-slate-50/40 flex justify-between items-start gap-3 shrink-0">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span class="px-2 py-0.5 text-[9px] font-bold text-slate-600 bg-slate-100 rounded-lg uppercase font-mono border border-slate-200/40">{{ activeDetailPlan()!.platform }}</span>
                  <span class="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100/60 rounded-lg font-sans">{{ activeDetailPlan()!.category }}</span>
                  
                  @switch (activeDetailPlan()!.status) {
                    @case ('Draft') { <span class="px-2.5 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-100">Draft</span> }
                    @case ('Scheduled') { <span class="px-2.5 py-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 rounded-lg border border-indigo-100">Scheduled</span> }
                    @case ('Published') { <span class="px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100">Published</span> }
                  }
                </div>
                <h3 class="text-base font-display font-semibold text-slate-900 leading-snug">{{ activeDetailPlan()!.title }}</h3>
              </div>
              <button (click)="closeDetailModal()" class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer border border-transparent hover:border-slate-200/50 transition-colors">
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <!-- Detail Content Body -->
            <div class="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm bg-white font-sans">
              
              <!-- Setup Info -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/50 select-none">
                <div>
                  <span class="block text-[9px] uppercase font-bold text-slate-400 leading-none mb-1 font-mono tracking-wider">Scheduled Date</span>
                  <span class="text-slate-800 font-semibold font-mono text-xs">{{ activeDetailPlan()!.scheduleDate }}</span>
                </div>
                <div>
                  <span class="block text-[9px] uppercase font-bold text-slate-400 leading-none mb-1 font-mono tracking-wider">Registered On</span>
                  <span class="text-slate-500 text-xs font-mono">{{ activeDetailPlan()!.createdAt | date:'medium' }}</span>
                </div>
              </div>

              <!-- Context -->
              <div>
                <h4 class="text-[10px] uppercase font-bold text-slate-400 mb-1.5 select-none font-mono tracking-wider">Concept Summary / Purpose Details</h4>
                <p class="text-slate-700 space-y-2 leading-relaxed text-sm font-sans">{{ activeDetailPlan()!.description }}</p>
              </div>

              <!-- AI Output / Caption copies -->
              <div>
                <h4 class="text-[10px] uppercase font-bold text-slate-400 mb-2 select-none font-mono tracking-wider flex items-center gap-1.5">
                  Written Captions & Copies
                  @if (activeDetailPlan()!.aiOutput) {
                    <span class="px-1.5 py-0.5 text-[8px] font-bold bg-slate-900 text-white rounded-md tracking-wider">AI ORIGINAL</span>
                  }
                </h4>
                
                @if (activeDetailPlan()!.aiOutput) {
                  <div class="bg-slate-50/40 border border-slate-200/60 rounded-xl p-4 font-normal overflow-x-hidden text-slate-800">
                    <pre class="whitespace-pre-wrap leading-relaxed font-sans text-xs select-text overflow-x-auto">{{ activeDetailPlan()!.aiOutput }}</pre>
                  </div>
                } @else {
                  <div class="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 leading-relaxed text-xs">
                    No caption drafts compiled. Tap editing controls to invoke Gemini AI assistance!
                  </div>
                }
              </div>

            </div>

            <!-- Detail Footer controls -->
            <div class="px-4 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-200/50 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button 
                type="button" 
                (click)="closeDetailModal()" 
                class="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer font-sans"
              >Good, close</button>
              <button 
                type="button" 
                (click)="promoteDetailToEdit()" 
                class="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs font-sans font-medium"
              >Edit Schedule Plan</button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class Dashboard {
  fb = inject(FormBuilder);
  tracker = inject(PlannerService);

  // Filters using Signals
  searchQuery = signal('');
  filterCategory = signal('');
  filterStatus = signal('');

  // AI Prompt signals
  selectedTemplateId = signal('');
  aiPromptText = signal('');
  selectedTone = signal('Professional & Engaging');

  // Standard lists of filtered plans
  filteredPlans = signal<ContentPlan[]>([]);
  prompts = this.tracker.prompts;

  // Modals signals
  isFormOpen = signal(false);
  isEditMode = signal(false);
  isDetailOpen = signal(false);

  // Forms references
  planForm!: FormGroup;
  activePlanId: string | null = null;
  activeDetailPlan = signal<ContentPlan | null>(null);

  // AI assistant configurations
  aiGenerationResult = signal<string | null>(null);

  constructor() {
    this.initForm();
    this.refreshPlans();

    // Trigger filter checks whenever source signals from service or locally change
    effect(() => {
      this.refreshPlans();
    });
  }

  initForm() {
    this.planForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      category: ['Social Media', [Validators.required]],
      platform: ['Instagram', [Validators.required]],
      scheduleDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      status: ['Draft', [Validators.required]],
      aiOutput: [''],
      promptUsed: ['None']
    });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onCategoryChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterCategory.set(value);
  }

  onStatusChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filterStatus.set(value);
  }

  refreshPlans() {
    let list = this.tracker.plans();

    // Search query
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // Category
    const cat = this.filterCategory();
    if (cat) {
      list = list.filter(p => p.category === cat);
    }

    // Status
    const stat = this.filterStatus();
    if (stat) {
      list = list.filter(p => p.status === stat);
    }

    this.filteredPlans.set(list);
  }

  // CREATE PLAN FLOW
  openCreateModal() {
    this.isEditMode.set(false);
    this.activePlanId = null;
    this.initForm();
    
    // Reset AI panel
    this.selectedTemplateId.set('');
    this.aiPromptText.set('');
    this.aiGenerationResult.set(null);

    this.isFormOpen.set(true);
  }

  // EDIT PLAN FLOW
  openEditModal(plan: ContentPlan) {
    this.isEditMode.set(true);
    this.activePlanId = plan.id;
    
    this.planForm.patchValue({
      title: plan.title,
      description: plan.description,
      category: plan.category,
      platform: plan.platform,
      scheduleDate: plan.scheduleDate,
      status: plan.status,
      aiOutput: plan.aiOutput || '',
      promptUsed: plan.promptUsed || 'None'
    });

    // Preset AI inputs
    this.selectedTemplateId.set('');
    this.aiPromptText.set(plan.promptUsed !== 'None' ? plan.promptUsed || '' : '');
    this.aiGenerationResult.set(null);

    this.isFormOpen.set(true);
  }

  // DELETE FLOW
  onDelete(id: string) {
    if (confirm('Are you absolutely sure you want to remove this scheduled content plan?')) {
      this.tracker.deletePlan(id);
      this.refreshPlans();
    }
  }

  // VIEW DETAILS FLOW
  openDetailModal(plan: ContentPlan) {
    this.activeDetailPlan.set(plan);
    this.isDetailOpen.set(true);
  }

  closeDetailModal() {
    this.isDetailOpen.set(false);
    this.activeDetailPlan.set(null);
  }

  promoteDetailToEdit() {
    const plan = this.activeDetailPlan();
    this.closeDetailModal();
    if (plan) {
      this.openEditModal(plan);
    }
  }

  closeFormModal() {
    this.isFormOpen.set(false);
  }

  clearBodyOutput() {
    this.planForm.patchValue({ aiOutput: '' });
  }

  // MANUAL EVENT PROCESSORS FOR AI PANEL (REPLACING NGMODEL)
  onPromptTextInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.aiPromptText.set(val);
  }

  onToneChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedTone.set(val);
  }

  onTemplateChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedTemplateId.set(val);

    if (!val) {
      this.aiPromptText.set('');
      return;
    }

    const t = this.prompts().find(p => p.id === val);
    if (t) {
      let replaced = t.promptText;
      const titleVal = this.planForm.get('title')?.value || this.searchQuery() || 'Enter topic content';
      replaced = replaced.replace('[Topic]', `"${titleVal}"`)
                         .replace('[Concept]', `"${titleVal}"`)
                         .replace('[Technology]', `"${titleVal}"`)
                         .replace('[Lesson Learned]', `"${titleVal}"`);
      this.aiPromptText.set(replaced);
    }
  }

  // TRIGGER AI COCOON GENERATOR
  async triggerAIGenerate() {
    const promptValue = this.aiPromptText().trim();
    if (!promptValue) return;

    this.aiGenerationResult.set(null);
    const category = this.planForm.get('category')?.value;
    const platform = this.planForm.get('platform')?.value;

    try {
      const generated = await this.tracker.generateAICaption(
        promptValue,
        category,
        platform,
        this.selectedTone()
      );
      this.aiGenerationResult.set(generated);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(errorMessage || 'Gemini Generation timed out or failed. Please check key authorization context.');
    }
  }

  applyAIEffectText() {
    const result = this.aiGenerationResult();
    if (result) {
      this.planForm.patchValue({
        aiOutput: result,
        promptUsed: this.aiPromptText()
      });
      this.aiGenerationResult.set(null); // Reset after applying
    }
  }

  savePlan() {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    const formData = this.planForm.value;

    if (this.isEditMode() && this.activePlanId) {
      this.tracker.updatePlan(this.activePlanId, formData);
    } else {
      this.tracker.addPlan(formData);
    }

    this.closeFormModal();
    this.refreshPlans();
  }
}
