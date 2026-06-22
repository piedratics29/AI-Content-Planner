import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlannerService, ContentPlan } from './planner.service';
import { MatIconModule } from '@angular/material/icon';

export interface CalendarDayDay {
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  plans: ContentPlan[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div id="calendar-wrapper" class="p-4 md:p-8 space-y-7 max-w-7xl mx-auto animate-fade-in select-none font-sans">
      
      <!-- Calendar Header Month Controller -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5.5">
        <div>
          <h1 class="text-2xl md:text-2xl font-display font-semibold text-slate-950 tracking-tight">Interactive Calendar</h1>
          <p class="text-xs text-slate-400 mt-1 font-sans">Visually organize, track, and prompt plans across your schedule stream.</p>
        </div>

        <!-- Scroll Buttons -->
        <div class="flex items-center gap-2 self-start sm:self-center">
          <button 
            (click)="prevMonth()" 
            class="w-9 h-9 rounded-xl bg-white border border-slate-200/60 hover:bg-slate-50 text-slate-650 flex items-center justify-center cursor-pointer transition-all"
            title="Previous Month"
          >
            <mat-icon class="scale-90 text-[18px]">chevron_left</mat-icon>
          </button>
          
          <span class="text-xs font-semibold text-slate-850 min-w-32 text-center select-none font-mono tracking-wide">
            {{ currentMonthName() }} {{ currentYear() }}
          </span>

          <button 
            (click)="nextMonth()" 
            class="w-9 h-9 rounded-xl bg-white border border-slate-200/60 hover:bg-slate-50 text-slate-655 flex items-center justify-center cursor-pointer transition-all"
            title="Next Month"
          >
            <mat-icon class="scale-90 text-[18px]">chevron_right</mat-icon>
          </button>

          <button 
            (click)="goToToday()" 
            class="px-3.5 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold font-sans text-xs flex items-center justify-center cursor-pointer transition-all ml-1 bg-slate-950 shadow-sm shadow-slate-950/10"
          >
             Today
          </button>
        </div>
      </div>

      <!-- Main Calendar Panel Grid wrapper -->
      <div class="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
        
        <!-- Weekdays Header Grid -->
        <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 select-none font-mono text-center text-[10px] font-bold text-slate-400 uppercase py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <!-- Month Days Grid (6 Rows x 7 Columns = 42 Grid elements) -->
        <div id="calendar-grid-cells" class="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-100 bg-slate-100/10">
          @for (day of calendarDays(); track day.dateString; let idx = $index) {
            <div 
              class="min-h-24 md:min-h-28 p-2 flex flex-col justify-between bg-white relative hover:bg-slate-50/30 transition-colors group"
              [class.bg-slate-50/40]="!day.isCurrentMonth"
            >
              
              <!-- Cell Number Header -->
              <div class="flex justify-between items-center select-none mb-1">
                <span 
                  class="font-mono text-xs font-bold leading-none p-1 w-5.5 h-5.5 flex items-center justify-center rounded-full"
                  [class.text-slate-900]="day.isCurrentMonth"
                  [class.text-slate-300]="!day.isCurrentMonth"
                  [class.bg-slate-950]="isToday(day.dateString)"
                  [class.text-white]="isToday(day.dateString)"
                >
                  {{ day.dayNumber }}
                </span>

                <!-- Schedule Instant shortcut -->
                <button 
                  (click)="openQuickCreate(day.dateString)"
                  class="opacity-0 group-hover:opacity-100 w-5.5 h-5.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-450 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
                  title="Schedule on this date"
                >
                  <mat-icon class="text-[14px] w-3.5 h-3.5 flex items-center leading-none">add</mat-icon>
                </button>
              </div>

              <!-- Day Content list (Scrollable if overflowing) -->
              <div class="flex-1 space-y-1 overflow-y-auto max-h-16 md:max-h-20 scrollbar-none pr-0.5">
                @for (plan of day.plans; track plan.id) {
                  <button 
                    type="button"
                    (click)="openDetailModal(plan)"
                    class="w-full text-left block text-[9px] md:text-[10px] p-1 font-semibold rounded-md truncate cursor-pointer select-none leading-tight border transition-all"
                    [class.bg-amber-50]="plan.status === 'Draft'"
                    [class.text-amber-700]="plan.status === 'Draft'"
                    [class.border-amber-100]="plan.status === 'Draft'"
                    
                    [class.bg-slate-50]="plan.status === 'Scheduled'"
                    [class.text-slate-800]="plan.status === 'Scheduled'"
                    [class.border-slate-205]="plan.status === 'Scheduled'"
                    
                    [class.bg-emerald-50]="plan.status === 'Published'"
                    [class.text-emerald-700]="plan.status === 'Published'"
                    [class.border-emerald-100]="plan.status === 'Published'"
                    [title]="plan.title"
                  >
                    <!-- Platform letter indicator -->
                    <span class="font-bold opacity-80 mr-0.5 font-mono">[{{ plan.platform.charAt(0) }}]</span>
                    {{ plan.title }}
                  </button>
                }
              </div>

            </div>
          }
        </div>
      </div>

      <!-- QUICK CREATE MODAL ON CALENDAR CELL -->
      @if (isQuickCreateOpen()) {
        <div class="fixed inset-0 bg-slate-950/25 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div class="bg-white rounded-2xl w-full max-w-md border border-slate-200/50 shadow-xl animate-scale-up overflow-hidden flex flex-col">
            
            <div class="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-slate-900 font-display">Quick Schedule Plan</h3>
                <p class="text-[10px] text-slate-400 mt-0.5 font-sans">Preset Date: {{ selectedDate() }}</p>
              </div>
              <button (click)="closeQuickCreate()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer">
                <mat-icon class="scale-90">close</mat-icon>
              </button>
            </div>

            <form [formGroup]="quickForm" (ngSubmit)="saveQuickPlan()" class="p-5 space-y-4 bg-white font-sans">
              <!-- Title -->
              <div>
                <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Asset Headline / Title</span>
                <input 
                  type="text" 
                  formControlName="title"
                  placeholder="e.g. My Awesome TikTok Video" 
                  class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/60 focus:bg-white rounded-xl text-xs focus:outline-none focus:border-slate-850 focus:ring-1 focus:ring-slate-800/10 transition-all font-sans"
                />
              </div>

              <!-- Context Description -->
              <div>
                <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Context Summary</span>
                <textarea 
                  rows="2"
                  formControlName="description"
                  placeholder="Summarize paragraph content..." 
                  class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/60 focus:bg-white rounded-xl text-xs focus:outline-none focus:border-slate-850 focus:ring-1 focus:ring-slate-800/10 transition-all resize-none font-sans"
                ></textarea>
              </div>

              <!-- Platform & Category Split Row -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Platform</span>
                  <select 
                    formControlName="platform"
                    class="w-full bg-slate-50 border border-slate-200/60 px-2.5 py-2 rounded-xl text-xs focus:outline-none cursor-pointer text-slate-650"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Twitter / X">Twitter / X</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Medium / Personal Blog">Blog</option>
                  </select>
                </div>
                <div>
                  <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Channel Category</span>
                  <select 
                    formControlName="category"
                    class="w-full bg-slate-50 border border-slate-200/60 px-2.5 py-2 rounded-xl text-xs focus:outline-none cursor-pointer text-slate-650"
                  >
                    <option value="Social Media">Social Media</option>
                    <option value="Blog">Blog</option>
                    <option value="Ads">Ads</option>
                  </select>
                </div>
              </div>

              <!-- Status -->
              <div>
                <span class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1.5">Workflow Status</span>
                <select 
                    formControlName="status"
                    class="w-full bg-slate-50 border border-slate-200/60 px-2.5 py-2 rounded-xl text-xs focus:outline-none cursor-pointer font-semibold text-slate-800"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Published">Published</option>
                  </select>
              </div>

              <!-- Buttons -->
              <div class="flex justify-end gap-2 pt-3.5 border-t border-slate-100">
                <button 
                  type="button" 
                  (click)="closeQuickCreate()" 
                  class="px-3.5 py-2 bg-slate-100 hover:bg-slate-150 rounded-xl text-xs font-semibold text-slate-600 transition-colors"
                >Cancel</button>
                <button 
                  type="submit" 
                  [disabled]="quickForm.invalid"
                  class="px-4.5 py-2 bg-slate-950 hover:bg-slate-800 rounded-xl text-xs font-semibold text-white transition-colors"
                >Save Plan</button>
              </div>
            </form>

          </div>
        </div>
      }

      <!-- READ DETAIL VIEW MODAL ON CALENDAR CLICK -->
      @if (isDetailOpen() && activeDetailPlan()) {
        <div class="fixed inset-0 bg-slate-950/25 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div class="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-xl overflow-hidden animate-scale-up flex flex-col">
            
            <div class="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
              <div>
                <div class="flex items-center gap-1.5 mb-1.5 flex-wrap text-[9px] font-bold text-slate-500 font-mono">
                  <span class="px-2 py-0.5 bg-slate-100 border border-slate-200/40 rounded-lg uppercase">{{ activeDetailPlan()!.platform }}</span>
                  <span class="px-2 py-0.5 bg-slate-100 rounded-lg uppercase">{{ activeDetailPlan()!.category }}</span>
                  
                  @switch (activeDetailPlan()!.status) {
                    @case ('Draft') { <span class="px-2.5 py-0.5 text-amber-700 bg-amber-50 rounded-lg border border-amber-100">Draft</span> }
                    @case ('Scheduled') { <span class="px-2.5 py-0.5 text-slate-700 bg-slate-50 rounded-lg border border-slate-200">Scheduled</span> }
                    @case ('Published') { <span class="px-2.5 py-0.5 text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100">Published</span> }
                  }
                </div>
                <h3 class="text-base font-semibold text-slate-900 leading-snug font-display">{{ activeDetailPlan()!.title }}</h3>
              </div>
              <button (click)="closeDetailModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer">
                <mat-icon class="scale-90">close</mat-icon>
              </button>
            </div>

            <div class="p-6 space-y-4 text-xs text-slate-600 bg-white leading-relaxed font-sans">
              <div class="flex justify-between items-center bg-slate-50/50 px-4 py-2.5 rounded-xl border border-slate-200/50 font-mono text-[10px]">
                <div>Date: <span class="text-slate-850 font-bold ml-1">{{ activeDetailPlan()!.scheduleDate }}</span></div>
                <div>Status: <span class="text-slate-850 font-bold ml-1">{{ activeDetailPlan()!.status }}</span></div>
              </div>
              
              <div>
                <h4 class="font-bold text-[10px] uppercase font-mono tracking-wider mb-1.5 select-none text-slate-400">Concept Context</h4>
                <p class="font-sans text-xs text-slate-700 leading-relaxed bg-slate-50/20 border border-slate-100 p-3 rounded-xl">{{ activeDetailPlan()!.description }}</p>
              </div>

              @if (activeDetailPlan()!.aiOutput) {
                <div>
                  <h4 class="font-bold text-[10px] uppercase font-mono tracking-wider mb-1.5 select-none text-slate-400">Written Draft Caption</h4>
                  <pre class="bg-slate-50/40 border border-slate-200/60 p-3.5 rounded-xl font-normal overflow-x-hidden whitespace-pre-wrap font-sans text-slate-800 select-text leading-relaxed font-mono text-[11px]">{{ activeDetailPlan()!.aiOutput }}</pre>
                </div>
              }
            </div>

            <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                type="button" 
                (click)="closeDetailModal()" 
                class="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
              >Good, close</button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class Calendar {
  tracker = inject(PlannerService);
  fb = inject(FormBuilder);

  today = new Date();
  currentYear = signal<number>(this.today.getFullYear());
  currentMonth = signal<number>(this.today.getMonth()); // 0-11

  // Modals signals
  isQuickCreateOpen = signal(false);
  selectedDate = signal<string>('');
  quickForm!: FormGroup;

  isDetailOpen = signal(false);
  activeDetailPlan = signal<ContentPlan | null>(null);

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  currentMonthName = computed(() => this.monthNames[this.currentMonth()]);

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const plansList = this.tracker.plans();

    const days: CalendarDayDay[] = [];

    // First day of current month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0: Sunday, 1: Monday, ...

    // Days in current month
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

    // Days in previous month (for padding)
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // 1. Fill previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYearVal = month === 0 ? year - 1 : year;
      const dateString = `${prevYearVal}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      
      const dayPlans = plansList.filter(p => p.scheduleDate === dateString);
      days.push({
        dateString,
        dayNumber: prevDay,
        isCurrentMonth: false,
        plans: dayPlans
      });
    }

    // 2. Fill current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPlans = plansList.filter(p => p.scheduleDate === dateString);
      
      days.push({
        dateString,
        dayNumber: day,
        isCurrentMonth: true,
        plans: dayPlans
      });
    }

    // 3. Fill next month padding days to make grid complete (42 cells)
    const totalCells = 42; 
    const nextDaysNeeded = totalCells - days.length;
    for (let day = 1; day <= nextDaysNeeded; day++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYearVal = month === 11 ? year + 1 : year;
      const dateString = `${nextYearVal}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayPlans = plansList.filter(p => p.scheduleDate === dateString);
      days.push({
        dateString,
        dayNumber: day,
        isCurrentMonth: false,
        plans: dayPlans
      });
    }

    return days;
  });

  constructor() {
    this.initQuickForm();
  }

  isToday(dateString: string): boolean {
    const todayStr = this.today.toISOString().split('T')[0];
    return dateString === todayStr;
  }

  prevMonth() {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
  }

  nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
  }

  goToToday() {
    this.currentMonth.set(this.today.getMonth());
    this.currentYear.set(this.today.getFullYear());
  }

  // DETAILS MODAL
  openDetailModal(plan: ContentPlan) {
    this.activeDetailPlan.set(plan);
    this.isDetailOpen.set(true);
  }

  closeDetailModal() {
    this.isDetailOpen.set(false);
    this.activeDetailPlan.set(null);
  }

  // INSTANT QUICK CREATE MODAL
  initQuickForm() {
    this.quickForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      category: ['Social Media', Validators.required],
      platform: ['Instagram', Validators.required],
      status: ['Draft', Validators.required]
    });
  }

  openQuickCreate(dateString: string) {
    this.selectedDate.set(dateString);
    this.initQuickForm();
    this.isQuickCreateOpen.set(true);
  }

  closeQuickCreate() {
    this.isQuickCreateOpen.set(false);
  }

  saveQuickPlan() {
    if (this.quickForm.invalid) {
      return;
    }

    const payload = {
      ...this.quickForm.value,
      scheduleDate: this.selectedDate()
    };

    this.tracker.addPlan(payload);
    this.closeQuickCreate();
  }
}
