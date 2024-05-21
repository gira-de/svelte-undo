import Page from './+page.svelte';
import { render, screen } from '@testing-library/svelte/svelte5';
import { userEvent } from '@testing-library/user-event';

test('should update input value after undo/redo', async () => {
  const user = userEvent.setup();
  render(Page);

  const firstnameInput = screen.getByLabelText('Firstname');
  const lastnameInput = screen.getByLabelText('Lastname');
  const applyButton = screen.getByRole('button', { name: 'Apply' });
  const undoButton = screen.getByRole('button', { name: 'Undo' });
  const redoButton = screen.getByRole('button', { name: 'Redo' });

  // change firstname input
  await user.type(firstnameInput, 'Foo');
  await user.click(applyButton);
  expect(firstnameInput).toHaveValue('Foo');
  expect(lastnameInput).toHaveValue('');

  // change lastname input
  await user.type(lastnameInput, 'Bar');
  await user.click(applyButton);
  expect(firstnameInput).toHaveValue('Foo');
  expect(lastnameInput).toHaveValue('Bar');

  //undo
  await user.click(undoButton);
  expect(firstnameInput).toHaveValue('Foo');
  expect(lastnameInput).toHaveValue('');

  // undo
  await user.click(undoButton);
  expect(firstnameInput).toHaveValue('');
  expect(lastnameInput).toHaveValue('');

  // redo
  await user.click(redoButton);
  expect(firstnameInput).toHaveValue('Foo');
  expect(lastnameInput).toHaveValue('');

  // redo
  await user.click(redoButton);
  expect(firstnameInput).toHaveValue('Foo');
  expect(lastnameInput).toHaveValue('Bar');
});

test('should disable/enable undo/redo buttons', async () => {
  const user = userEvent.setup();
  render(Page);

  const firstnameInput = screen.getByLabelText('Firstname');
  const applyButton = screen.getByRole('button', { name: 'Apply' });
  const undoButton = screen.getByRole('button', { name: 'Undo' });
  const redoButton = screen.getByRole('button', { name: 'Redo' });

  expect(undoButton).toBeDisabled();
  expect(redoButton).toBeDisabled();

  // change input
  await user.type(firstnameInput, 'Foo');
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

test('should not create undo step if value is unchanged', async () => {
  const user = userEvent.setup();
  render(Page);

  const firstnameInput = screen.getByLabelText('Firstname');
  const applyButton = screen.getByRole('button', { name: 'Apply' });
  const undoList = screen.getByRole('list');

  // click apply
  await user.click(applyButton);
  expect(undoList.children).toHaveLength(1);

  // change input and click apply
  await user.type(firstnameInput, 'Foo');
  await user.click(applyButton);
  expect(undoList.children).toHaveLength(2);

  // click apply
  await user.click(applyButton);
  expect(undoList.children).toHaveLength(2);
});
