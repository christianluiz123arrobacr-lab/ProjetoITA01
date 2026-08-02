/**
 * Renderizador Genérico de Conteúdo
 * 
 * Interpreta blocos de conteúdo serializáveis e renderiza componentes React.
 * Permite exportação futura para PDF, API, mobile, etc.
 */

import type { ContentBlock } from '@/shared/types';
import type { ContentRendererProps } from '@/shared/types/content-renderer';

// Importar renderizadores de blocos individuais
import { TextBlockRenderer } from './blocks/TextBlock';
import { FormulaBlockRenderer } from './blocks/FormulaBlock';
import { ExampleBlockRenderer } from './blocks/ExampleBlock';
import { ListBlockRenderer } from './blocks/ListBlock';
import { ImageBlockRenderer } from './blocks/ImageBlock';
import { VideoBlockRenderer } from './blocks/VideoBlock';
import { TableBlockRenderer } from './blocks/TableBlock';
import { QuoteBlockRenderer } from './blocks/QuoteBlock';
import { AlertBlockRenderer } from './blocks/AlertBlock';
import { DividerBlockRenderer } from './blocks/DividerBlock';

/**
 * Renderizador principal de conteúdo
 */
export function ContentRenderer({ blocks, className = '' }: ContentRendererProps) {
  return (
    <div className={`content-renderer space-y-4 ${className}`}>
      {blocks.map((block, index) => (
        <BlockRenderer key={index} block={block} index={index} />
      ))}
    </div>
  );
}

/**
 * Renderizador individual de bloco (switch por tipo)
 */
function BlockRenderer({ block, index }: { block: ContentBlock; index: number }) {
  switch (block.type) {
    case 'text':
      return <TextBlockRenderer block={block} index={index} />;
    
    case 'formula':
      return <FormulaBlockRenderer block={block} index={index} />;
    
    case 'example':
      return <ExampleBlockRenderer block={block} index={index} />;
    
    case 'list':
      return <ListBlockRenderer block={block} index={index} />;
    
    case 'image':
      return <ImageBlockRenderer block={block} index={index} />;
    
    case 'video':
      return <VideoBlockRenderer block={block} index={index} />;
    
    case 'table':
      return <TableBlockRenderer block={block} index={index} />;
    
    case 'quote':
      return <QuoteBlockRenderer block={block} index={index} />;
    
    case 'alert':
      return <AlertBlockRenderer block={block} index={index} />;
    
    case 'divider':
      return <DividerBlockRenderer />;
    
    case 'interactive':
      // Placeholder para blocos interativos futuros
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
          Bloco interativo (em desenvolvimento)
        </div>
      );
    
    default:
      // Tipo desconhecido
      console.warn('Tipo de bloco desconhecido:', (block as any).type);
      return null;
  }
}

export default ContentRenderer;
