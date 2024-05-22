import Page from './+page.svelte';
import { render, screen, within } from '@testing-library/svelte/svelte5';
import { userEvent } from '@testing-library/user-event';
import { describe } from 'node:test';

describe('clear', () => {
  test('should remove all actions and create a new init action', async () => {
    const user = userEvent.setup();
    render(Page);

    const nameInput = screen.getByLabelText('Name');
    const applyButton = screen.getByRole('button', { name: 'Apply' });
    const clearButton = screen.getByRole('button', { name: 'Clear' });

    // create some stack entries
    await user.type(nameInput, '1');
    await user.click(applyButton);
    await user.type(nameInput, '2');
    await user.click(applyButton);
    expect(screen.getAllByRole('row')).toHaveLength(4);

    // click clear
    await user.click(clearButton);

    // only one table row should be left
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('init');
    expect(screen.getAllByRole('row')[1]).toHaveClass('selected');
  });
});

describe('clearUndo', () => {
  test('should remove applied actions from stack', async () => {
    const user = userEvent.setup();
    render(Page);

    const nameInput = screen.getByLabelText('Name');
    const applyButton = screen.getByRole('button', { name: 'Apply' });
    const undoButton = screen.getByRole('button', { name: 'Undo' });
    const clearUndoButton = screen.getByRole('button', { name: 'Clear Undo' });

    // create some stack entries
    await user.type(nameInput, '1');
    await user.click(applyButton);
    await user.type(nameInput, '2');
    await user.click(applyButton);

    // undo and then clear undo
    await user.click(undoButton);
    await user.click(clearUndoButton);

    // only one table row should be left
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent(
      'Name changed to 1',
    );
    expect(screen.getAllByRole('row')[2]).toHaveTextContent(
      'Name changed to 12',
    );
    expect(screen.getAllByRole('row')[1]).toHaveClass('selected');
  });
});

describe('clearRedo', () => {
  test('should remove unapplied actions from stack', async () => {
    const user = userEvent.setup();
    render(Page);

    const nameInput = screen.getByLabelText('Name');
    const applyButton = screen.getByRole('button', { name: 'Apply' });
    const undoButton = screen.getByRole('button', { name: 'Undo' });
    const clearRedoButton = screen.getByRole('button', { name: 'Clear Redo' });

    // create some stack entries
    await user.type(nameInput, '1');
    await user.click(applyButton);
    await user.type(nameInput, '2');
    await user.click(applyButton);

    // undo and then clear undo
    await user.click(undoButton);
    await user.click(clearRedoButton);

    // only one table row should be left
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('init');
    expect(screen.getAllByRole('row')[2]).toHaveTextContent(
      'Name changed to 1',
    );
    expect(screen.getAllByRole('row')[2]).toHaveClass('selected');
  });
});

describe('goto', () => {
  test('should apply the specified state', async () => {
    const user = userEvent.setup();
    render(Page);

    const nameInput = screen.getByLabelText('Name');
    const applyButton = screen.getByRole('button', { name: 'Apply' });

    // create some stack entries
    await user.type(nameInput, '1');
    await user.click(applyButton);
    await user.type(nameInput, '2');
    await user.click(applyButton);
    await user.type(nameInput, '3');
    await user.click(applyButton);

    // apply second action
    await user.click(
      within(screen.getAllByRole('row')[2]).getByRole('button', {
        name: 'Apply',
      }),
    );

    // value of the second action should have be loaded
    expect(screen.getByRole('textbox')).toHaveValue('1');

    // second action should be selected
    expect(screen.getAllByRole('row')[2]).toHaveClass('selected');
  });
});
