import { redirect, notFound } from 'next/navigation';
import { getLinkBySource } from '@/lib/db';

interface RedirectPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function RedirectPage({ params }: RedirectPageProps) {
  const { slug } = await params;
  const path = `/${slug.join('/')}`;
  
  try {
    const link = await getLinkBySource(path);
    
    if (link) {
      redirect(link.destination);
    } else {
      notFound();
    }
  } catch (error) {
    console.error('Error fetching redirect:', error);
    notFound();
  }
}

export async function generateMetadata({ params }: RedirectPageProps) {
  const { slug } = await params;
  const path = `/${slug.join('/')}`;
  
  try {
    const link = await getLinkBySource(path);
    
    if (link) {
      return {
        title: link.title || 'URL Shortener - Redirecting...',
        description: link.description || `Redirecting to ${link.destination}`,
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  return {
    title: 'Page Not Found',
    description: 'The requested page could not be found.',
  };
}
