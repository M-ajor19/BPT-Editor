// Performance monitoring utilities for Core Web Vitals
export function measureLCP(callback) {
  if (typeof window === 'undefined') return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry) {
        callback({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
        });
      }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.warn('LCP measurement not supported:', error);
  }
}

export function measureCLS(callback) {
  if (typeof window === 'undefined') return;
  
  try {
    let clsValue = 0;
    let clsEntries = [];
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = clsEntries[0];
          const lastSessionEntry = clsEntries[clsEntries.length - 1];
          
          if (!firstSessionEntry || entry.startTime - lastSessionEntry.startTime < 1000) {
            clsEntries.push(entry);
          } else {
            clsEntries = [entry];
          }
          
          clsValue = clsEntries.reduce((sum, entry) => sum + entry.value, 0);
          
          callback({
            name: 'CLS',
            value: clsValue,
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.warn('CLS measurement not supported:', error);
  }
}

export function measureINP(callback) {
  if (typeof window === 'undefined') return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback({
          name: 'INP',
          value: entry.processingStart - entry.startTime,
          rating: entry.processingStart - entry.startTime < 200 ? 'good' : 
                  entry.processingStart - entry.startTime < 500 ? 'needs-improvement' : 'poor'
        });
      }
    });
    
    observer.observe({ entryTypes: ['event'] });
  } catch (error) {
    console.warn('INP measurement not supported:', error);
  }
}

// Initialize performance monitoring in production
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return;
  
  measureLCP((metric) => {
    console.log('LCP:', metric);
    // Send to analytics service if needed
  });
  
  measureCLS((metric) => {
    console.log('CLS:', metric);
    // Send to analytics service if needed
  });
  
  measureINP((metric) => {
    console.log('INP:', metric);
    // Send to analytics service if needed
  });
}
