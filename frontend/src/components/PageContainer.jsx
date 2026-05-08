/**
 * PageContainer
 * -------------
 * Centres page content at a consistent width with standard padding.
 * Use inside any full-page component instead of ad-hoc max-w-* classes.
 *
 * Usage:
 *   <PageContainer>
 *     ...page content...
 *   </PageContainer>
 *
 *   <PageContainer noPad>   ← skip horizontal padding (for full-bleed sections)
 *     <img ... />
 *   </PageContainer>
 */
export default function PageContainer({ children, className = '', noPad = false }) {
  return (
    <div
      className={`w-full mx-auto ${noPad ? '' : 'px-4'} ${className}`}
      style={{ maxWidth: '480px' }}
    >
      {children}
    </div>
  );
}
