import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AudioPlayer from '@/components/ui/AudioPlayer';

// Mock HTMLAudioElement
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Mock HTMLAudioElement
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(mockPlay);
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(mockPause);

  Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
    writable: true,
    value: 120,
  });

  Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
    writable: true,
    value: 0,
  });
});

describe('AudioPlayer', () => {
  const defaultProps = {
    src: 'test-audio.mp3',
  };

  describe('Rendering', () => {
    it('should render with default received variant', () => {
      render(<AudioPlayer {...defaultProps} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with sent variant', () => {
      render(<AudioPlayer {...defaultProps} variant="sent" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with preview variant', () => {
      render(<AudioPlayer {...defaultProps} variant="preview" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should display time as 0:00 initially', () => {
      render(<AudioPlayer {...defaultProps} />);

      const timeElements = screen.getAllByText('0:00');
      expect(timeElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Play/Pause', () => {
    it('should toggle play state when button is clicked', async () => {
      render(<AudioPlayer {...defaultProps} />);

      const playButton = screen.getByRole('button');

      // Click to play
      fireEvent.click(playButton);
      expect(mockPlay).toHaveBeenCalled();

      // Click to pause
      fireEvent.click(playButton);
      expect(mockPause).toHaveBeenCalled();
    });
  });

  describe('formatTime', () => {
    it('should display formatted time', () => {
      render(<AudioPlayer {...defaultProps} />);

      // The initial time should be 0:00
      expect(screen.getAllByText('0:00').length).toBeGreaterThanOrEqual(1);
    });
  });
});
