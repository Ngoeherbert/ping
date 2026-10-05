export const BUBBLE_RADIUS = 18;

export const bubbleColors = (own) =>
  own
    ? {
        bg: '#007AFF',
        text: '#FFFFFF',
        sub: 'rgba(255,255,255,0.75)',
        barOn: '#FFFFFF',
        barOff: 'rgba(255,255,255,0.4)',
        chip: 'rgba(255,255,255,0.22)',
        btnBg: '#FFFFFF',
        btnIcon: '#007AFF',
      }
    : {
        bg: '#E9E9EB',
        text: '#111111',
        sub: '#6B6B70',
        barOn: '#111111',
        barOff: 'rgba(0,0,0,0.25)',
        chip: 'rgba(0,0,0,0.08)',
        btnBg: '#007AFF',
        btnIcon: '#FFFFFF',
      };
