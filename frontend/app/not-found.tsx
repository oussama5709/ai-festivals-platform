import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-5 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <FileQuestion className="w-8 h-8 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This event seems to have moved or been removed.
          </p>
        </div>
        <Link
          href="/events"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Browse all events
        </Link>
      </div>
    </>
  );
}
