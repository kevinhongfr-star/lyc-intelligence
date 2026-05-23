export type ICP = 'client' | 'consultant' | 'leader' | 'candidate';
export type AssessmentType = string;
export interface AssessmentReport { title: string; summary: string; sections: Array<{heading:string; content:string}>; }
export interface User { id: string; email: string; name: string; icp: ICP; role: string; }
