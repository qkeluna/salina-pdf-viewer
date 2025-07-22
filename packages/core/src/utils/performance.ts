// Performance utilities for the PDF viewer
export class PerformanceOptimizer {
  private static rafId: number | null = null
  private static taskQueue: (() => void)[] = []
  
  /**
   * Debounce function calls to improve performance
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: any
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }
  
  /**
   * Throttle function calls to limit execution frequency
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
  
  /**
   * Queue tasks to be executed on next animation frame
   */
  static queueTask(task: () => void): void {
    this.taskQueue.push(task)
    
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.processTasks()
        this.rafId = null
      })
    }
  }
  
  private static processTasks(): void {
    const tasks = this.taskQueue.splice(0)
    tasks.forEach(task => {
      try {
        task()
      } catch (error) {
        console.error('Task execution error:', error)
      }
    })
  }
  
  /**
   * Create a cancellable timeout
   */
  static createCancellableTimeout(
    callback: () => void,
    delay: number
  ): { cancel: () => void } {
    const timeoutId = setTimeout(callback, delay)
    
    return {
      cancel: () => clearTimeout(timeoutId)
    }
  }
  
  /**
   * Measure and log performance metrics
   */
  static measurePerformance<T>(
    name: string,
    fn: () => T
  ): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  }
  
  /**
   * Create a performance observer for monitoring
   */
  static createPerformanceObserver(
    callback: (entries: PerformanceEntry[]) => void
  ): PerformanceObserver | null {
    if (typeof PerformanceObserver === 'undefined') {
      return null
    }
    
    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries())
    })
    
    try {
      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] } as any)
      return observer
    } catch (error) {
      console.warn('Performance observer not supported:', error)
      return null
    }
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  private static cache = new Map<string, any>()
  private static maxCacheSize = 50
  
  /**
   * Store item in cache with automatic cleanup
   */
  static setCache(key: string, value: any): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, value)
  }
  
  /**
   * Get item from cache
   */
  static getCache(key: string): any {
    return this.cache.get(key) || null
  }
  
  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear()
  }
  
  /**
   * Get current memory usage (if available)
   */
  static getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory
    }
    return null
  }
  
  /**
   * Force garbage collection (development only)
   */
  static forceGC(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }
  }
}

/**
 * Virtual scrolling utilities for large PDF documents
 */
export class VirtualScrolling {
  private container: HTMLElement
  private itemHeight: number
  private visibleRange: { start: number; end: number } = { start: 0, end: 0 }
  private totalItems: number = 0
  
  constructor(container: HTMLElement, itemHeight: number) {
    this.container = container
    this.itemHeight = itemHeight
    console.log('VirtualScrolling initialized for container:', container.tagName)
  }
  
  /**
   * Calculate visible range based on scroll position
   */
  calculateVisibleRange(scrollTop: number, containerHeight: number): { start: number; end: number } {
    const start = Math.floor(scrollTop / this.itemHeight)
    const visibleCount = Math.ceil(containerHeight / this.itemHeight)
    const end = Math.min(start + visibleCount + 1, this.totalItems - 1)
    
    this.visibleRange = { start: Math.max(0, start - 1), end }
    return this.visibleRange
  }
  
  /**
   * Get current visible range
   */
  getVisibleRange(): { start: number; end: number } {
    return this.visibleRange
  }
  
  /**
   * Set total number of items
   */
  setTotalItems(count: number): void {
    this.totalItems = count
  }
  
  /**
   * Get total height of all items
   */
  getTotalHeight(): number {
    return this.totalItems * this.itemHeight
  }
}