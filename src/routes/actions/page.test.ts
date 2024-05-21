import Page from './+page.svelte';
import { render, screen } from '@testing-library/svelte/svelte5';
import { userEvent } from '@testing-library/user-event';

test('should update input value after undo/redo', async () => {
  const user = userEvent.setup();
  render(Page);

  const valueInput = screen.getByLabelText('Value');
  const applyButton = screen.getByRole('button', { name: 'Apply' });
  const undoButton = screen.getByRole('button', { name: 'Undo' });
  const redoButton = screen.getByRole('button', { name: 'Redo' });

  // change input
  await user.type(valueInput, 'foobar');
  await user.click(applyButton);
  expect(valueInput).toHaveValue('foobar');

  // undo
  await user.click(undoButton);
  expect(valueInput).toHaveValue('');

  // redo
  await user.click(redoButton);
  expect(valueInput).toHaveValue('foobar');
});

test('should disable/enable undo/redo buttons', async () => {
  const user = userEvent.setup();
  render(Page);

  const valueInput = screen.getByLabelText('Value');
  const applyButton = screen.getByRole('button', { name: 'Apply' });
  const undoButton = screen.getByRole('button', { name: 'Undo' });
  const redoButton = screen.getByRole('button', { name: 'Redo' });

  expect(undoButton).toBeDisabled();
  expect(redoButton).toBeDisabled();

  // change input
  await user.type(valueInput, 'foobar');
  await user.click(applyButton);
  expect(undoButton).toBeEnabled();
  expect(redoButton).toBeDisabled();

  // undo
  await user.click(undoButton);
  expect(undoButton).toBeDisabled();
  expect(redoButton).toBeEnabled();

  // redo
  await user.click(redoButton);
  expect(undoButton).toBeEnabled();
  expect(redoButton).toBeDisabled();
});

test('should update undo stack', async () => {
  const user = userEvent.setup();
  render(Page);

  const valueInput = screen.getByLabelText('Value');
  const applyButton = screen.getByRole('button', { name: 'Apply' });
  const undoList = screen.getByRole('list');

  // change input and check stack entries
  await user.type(valueInput, 'Foo');
  await user.click(applyButton);
  expect(undoList.children).toHaveLength(2);

  // change input and check stack entries
  await user.type(valueInput, 'Bar');
  await user.click(applyButton);
  expect(undoList.children).toHaveLength(3);
});
