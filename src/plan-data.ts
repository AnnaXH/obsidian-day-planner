import type { DayPlannerSettings } from './settings';

const moment = (window as any).moment;

export class PlanSummaryData {
    empty: boolean;
    invalid: boolean;
    items: PlanItem[];
    past: PlanItem[];
    current: PlanItem;
    next: PlanItem;
    
    constructor(items: PlanItem[]){
        this.empty = items.length < 1;
        this.invalid = false;
        this.items = items;
        this.past = [];
    }

    calculate(): void {
        try {
            const now = new Date();
            if(this.items.length === 0){
                this.empty = true;
                return;
            }
            this.items.forEach((item, i) => {
                const next = this.items[i+1];
                if(item.time < now && (item.isEnd || (next && now < next.time))) {
                    this.current = item;
                    if (item.isEnd) {
                        item.isPast = true;
                        this.past.push(item);
                    }
                    this.next = item.isEnd ? null : next;
                } else if(item.time < now) {
                    item.isPast = true;
                    this.past.push(item);
                }
                if(next){
                    const untilNext = moment.duration(moment(next.time).diff(moment(item.time))).asMinutes();
                    item.durationMins = untilNext;
                }
            });
        } catch (error) {
            console.log(error)
        }
    }

}

export class PlanItem {

    matchIndex: number;
    charIndex: number;
    isCompleted: boolean;
    isPast: boolean;
    isBreak: boolean;
    isEnd: boolean;
    project: string;
    colorCode: number;
    time: Date;
    durationMins: number;
    rawTime: string;
    text: string;
    raw: string;

    constructor(matchIndex: number, charIndex: number, isCompleted: boolean, 
        isBreak: boolean, isEnd: boolean, project: string, time: Date, rawTime:string, text: string, raw: string){
        this.matchIndex = matchIndex;
        this.charIndex = charIndex;
        this.isCompleted = isCompleted;
        this.isBreak = isBreak;
        this.isEnd = isEnd;
        this.project = project;
        this.time = time;
        this.rawTime = rawTime;
        this.text = text;
        this.raw = raw;
    }
}

export class PlanItemFactory {
    private settings: DayPlannerSettings;

    constructor(settings: DayPlannerSettings) {
        this.settings = settings;
    }

    getPlanItem(matchIndex: number, charIndex: number, isCompleted: boolean, isBreak: boolean, isEnd: boolean, label:string, time: Date, rawTime: string, text: string, raw: string) {
        const displayText = this.getDisplayText(isBreak, isEnd, label, text);
        let item = new PlanItem(matchIndex, charIndex, isCompleted, isBreak, isEnd, label, time, rawTime, displayText, raw);
        if (this.settings.useProjectColor) item.colorCode = this.getColorCode(item);
        return item;
    }

    getDisplayText(isBreak: boolean, isEnd: boolean, label:string, text: string) {
        if(isBreak) {
            return text? this.settings.breakLabel + ' ' + text : this.settings.breakLabel;
        }
        if(isEnd) {
            return this.settings.endLabel;
        }
        return label? `${label} ${text}` : text;
    }

    getColorCode(item:PlanItem): number {
        let project = '';
        if (item.isBreak) {
            project = 'break';
        } else if (item.project && item.project.length > 1) {
            project = item.project.slice(1).toLowerCase();
        } else {
            return 0
        }
        const match = this.settings.projectColors.filter(pcl => pcl.project === project);
        if (match.length) {
          return match[0].code;
        } else {
          return 0;
        }
      }
    
    }