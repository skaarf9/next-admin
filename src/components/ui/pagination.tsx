import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="outline"
        disabled={prevDisabled}
        onClick={() => !prevDisabled && onPageChange(page - 1)}
      >
        Prev
      </Button>

      <span className="text-sm">
        Page {page} of {totalPages}
      </span>

      <Button
        size="sm"
        variant="outline"
        disabled={nextDisabled}
        onClick={() => !nextDisabled && onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
};