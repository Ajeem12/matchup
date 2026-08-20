import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MatchButton from './MatchButton.jsx';

describe('MatchButton', () => {
  it('does not render outside an active match window', () => {
    render(
      <MatchButton
        active={false}
        closesAt={Date.now() + 1000}
        alreadyPressed={false}
        onPress={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'MATCH!' })).not.toBeInTheDocument();
  });

  it('disables the button after the player has pressed', () => {
    const onPress = vi.fn();
    render(<MatchButton active closesAt={Date.now() + 1000} alreadyPressed onPress={onPress} />);

    const button = screen.getByRole('button', { name: 'PRESSED' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('calls the press handler for an active player', () => {
    const onPress = vi.fn();
    render(
      <MatchButton active closesAt={Date.now() + 1000} alreadyPressed={false} onPress={onPress} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'MATCH!' }));
    expect(onPress).toHaveBeenCalledOnce();
  });
});
