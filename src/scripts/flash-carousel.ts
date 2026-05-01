export function initFlashCarousel(): void {
  const root = document.getElementById('flash-carousel');
  if (!root || root.dataset.carouselInit === '1') return;
  root.dataset.carouselInit = '1';

  const trackEl = root.querySelector('.carousel-track');
  const prev = root.querySelector('.carousel-prev');
  const next = root.querySelector('.carousel-next');
  const dots = root.querySelectorAll('.carousel-dot');

  if (!(trackEl instanceof HTMLElement)) return;
  const track = trackEl;

  const getSlideCount = () => track.querySelectorAll('article[data-slide-index]').length;

  const scrollToIndex = (index: number) => {
    const n = getSlideCount();
    if (!n) return;
    const clamped = Math.max(0, Math.min(index, n - 1));
    const w = track.clientWidth || 1;
    track.scrollTo({ left: clamped * w, behavior: 'smooth' });
  };

  const currentIndex = () => {
    const n = getSlideCount();
    if (!n) return 0;
    const w = track.clientWidth || 1;
    return Math.round(track.scrollLeft / w);
  };

  const syncDots = () => {
    const i = currentIndex();
    dots.forEach((d, idx) => {
      const active = idx === i;
      d.setAttribute('data-active', active ? 'true' : 'false');
      d.setAttribute('aria-current', active ? 'true' : 'false');
    });
  };

  const goPrev = () => {
    const n = getSlideCount();
    const i = currentIndex();
    scrollToIndex(i - 1 < 0 ? n - 1 : i - 1);
  };

  const goNext = () => {
    const n = getSlideCount();
    const i = currentIndex();
    scrollToIndex(i + 1 >= n ? 0 : i + 1);
  };

  prev?.addEventListener('click', goPrev);
  next?.addEventListener('click', goNext);

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const raw = dot.getAttribute('data-dot-index');
      const idx = raw ? parseInt(raw, 10) : 0;
      scrollToIndex(idx);
    });
  });

  track.addEventListener(
    'scroll',
    () => {
      syncDots();
    },
    { passive: true }
  );

  track.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  });

  window.addEventListener('resize', syncDots, { passive: true });

  syncDots();
}
