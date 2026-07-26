import { CSSProperties, useEffect, useRef, useState } from 'react';
import { normalizeMathSource } from '@/lib/mathRendering';

interface MathFormulaProps {
  children?: string;
  formula?: string;
  inline?: boolean;
  display?: boolean;
  className?: string;
}

class MathJaxQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  async add(renderFn: () => Promise<void>) {
    this.queue.push(renderFn);
    if (!this.isProcessing) {
      await this.process();
    }
  }

  private async process() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const renderFn = this.queue.shift();

    if (renderFn) {
      try {
        await renderFn();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('MathJax render warning:', error);
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 40));
    await this.process();
  }
}

const mathJaxQueue = new MathJaxQueue();

export function MathFormula({
  children,
  formula,
  inline,
  display,
  className = '',
}: MathFormulaProps) {
  const isDisplay =
    inline !== undefined ? !inline : display !== undefined ? display : true;

  const content = children || formula || '';
  const ref = useRef<HTMLElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const delimiter = isDisplay ? '$$' : '$';

  let cleanFormula = normalizeMathSource(content).trim();
  if (cleanFormula.startsWith('$$') && cleanFormula.endsWith('$$')) {
    cleanFormula = cleanFormula.slice(2, -2).trim();
  } else if (cleanFormula.startsWith('$') && cleanFormula.endsWith('$')) {
    cleanFormula = cleanFormula.slice(1, -1).trim();
  }

  const mathContent = `${delimiter}${cleanFormula}${delimiter}`;

  useEffect(() => {
    if (!isMounted || !ref.current) return;
    if (!document.body.contains(ref.current)) return;

    const renderMath = async () => {
      if (typeof window === 'undefined' || !(window as any).MathJax) return;
      if (!isMounted || !ref.current || !document.body.contains(ref.current)) return;

      try {
        ref.current.innerHTML = mathContent;
        await (window as any).MathJax.typesetPromise?.([ref.current]);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('MathJax render warning:', error);
        }
      }
    };

    mathJaxQueue.add(renderMath);
  }, [mathContent, isMounted]);

  const style: CSSProperties = {
    display: isDisplay ? 'block' : 'inline-block',
    textAlign: isDisplay ? 'center' : ('inherit' as const),
    padding: isDisplay ? '0.75rem 0' : '0',
    margin: isDisplay ? '0.25rem 0' : '0',
    overflow: 'visible',
    minHeight: isDisplay ? '2rem' : 'auto',
    border: 'none',
    background: 'transparent',
    lineHeight: isDisplay ? '1.4' : 'inherit',
    fontFamily: 'inherit',
    verticalAlign: inline ? 'middle' : undefined,
  };

  if (isDisplay) {
    return <div ref={ref as any} className={className} style={style} />;
  }

  return <span ref={ref as any} className={className} style={style} />;
}
