import { redirect, notFound } from 'next/navigation';
import { getLinkBySource } from '@/lib/db';
import redirectsData from '@/redirects.json';

interface RedirectPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

interface RedirectPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function RedirectPage({ params }: RedirectPageProps) {
  const { slug } = await params;
  const path = `/${slug.join('/')}`;
  
  console.log('Redirect page accessed with path:', path);
  console.log('Slug array:', slug);
  
  try {
    // First, try to get link from database
    const link = await getLinkBySource(path);
    
    if (link) {
      console.log('Found in database, redirecting to:', link.destination);
      redirect(link.destination);
    } else {
      console.log('Not found in database, checking static redirects...');
      
      // Check static redirects from JSON file
      const staticRedirect = redirectsData.redirects.find(r => r.source === path);
      
      if (staticRedirect) {
        console.log('Found in static redirects, redirecting to:', staticRedirect.destination);
        redirect(staticRedirect.destination);
      } else {
        console.log('No redirect found anywhere, showing 404');
        notFound();
      }
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
    // First check database
    const link = await getLinkBySource(path);
    
    if (link) {
      return {
        title: link.title || 'URL Shortener - Redirecting...',
        description: link.description || `Redirecting to ${link.destination}`,
      };
    } else {
      // Check static redirects
      const staticRedirect = redirectsData.redirects.find(r => r.source === path);
      
      if (staticRedirect) {
        return {
          title: 'URL Shortener - Redirecting...',
          description: `Redirecting to ${staticRedirect.destination}`,
        };
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  return {
    title: 'Page Not Found',
    description: 'The requested page could not be found.',
  };
}
