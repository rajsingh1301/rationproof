import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) { return <table className={cn('w-full table-fixed border-collapse text-left text-sm', className)} {...props} />; }
export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) { return <thead className={cn('border-b bg-muted text-xs text-muted-foreground', className)} {...props} />; }
export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) { return <tbody {...props} />; }
export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) { return <tr className={cn('border-b last:border-0', className)} {...props} />; }
export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) { return <td className={cn('break-words px-4 py-4 align-top', className)} {...props} />; }
