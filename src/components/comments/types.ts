export type Pin = { xPct: number; yPct: number };

export type DragBox = {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
};

export type CommentStatus = 'pending' | 'complete' | 'error';

export type Comment = {
  id: string;
  pin: Pin;
  dragBox?: DragBox;
  instruction: string;
  status: CommentStatus;
  createdAt: number;
};
