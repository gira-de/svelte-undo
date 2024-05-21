import Page from './+page.svelte';
import { render, screen } from '@testing-library/svelte/svelte5';
import { userEvent } from '@testing-library/user-event';

test('should save and load snapshot correctly', async () => {
  const user = userEvent.setup();
  render(Page);

  const firstnameInput = screen.getByLabelText('Firstname');
  const lastnameInput = screen.getByLabelText('Lastname');
  const applyButton = screen.getByRole('button', { name: 'Apply' });
  const undoButton = screen.getByRole('button', { name: 'Undo' });
  const redoButton = screen.getByRole('button', { name: 'Redo' });
  const createSnaptshotButton = screen.getByRole('button', {
    name: 'Create Snapshot',
  });
  const loadSnapshotButton = screen.getByRole('button', {
    name: 'Load Snapshot',
  });

  // change input and create snapshot
  await user.type(firstnameInput, 'Foo');
  await user.type(lastnameInput, 'Bar');
  await user.click(applyButton);
  await user.click(createSnaptshotButton);

  // undo
  await user.click(undoButton);
  expect(firstnameInput).toHaveValue('');
  expect(lastnameInput).toHaveValue('');
  expect(undoButton).toBeDisabled();
  expect(redoButton).toBeEnabled();

  // load snapshot
  await user.click(loadSnapshotButton);
  expect(firstnameInput).toHaveValue('Foo');
  expect(lastnameInput).toHaveValue('Bar');
  expect(undoButton).toBeEnabled();
  expect(redoButton).toBeDisabled();

  // undo
  await user.click(undoButton);
  expect(firstnameInput).toHaveValue('');
  expect(lastnameInput).toHaveValue('');
  expect(undoButton).toBeDisabled();
  expect(redoButton).toBeEnabled();

  // redo
  await user.click(redoButton);
  expect(firstnameInput).toHaveValue('Foo');
  expect(lastnameInput).toHaveValue('Bar');
  expect(undoButton).toBeEnabled();
  expect(redoButton).toBeDisabled();
});
