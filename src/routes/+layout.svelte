<script>
  import './styles.css';
  const { children } = $props();
</script>

<nav>
  <a href="actions">Actions</a>
  <a href="transaction">Transaction</a>
  <a href="snapshot">Snapshot</a>
  <a href="history-stack">History</a>
</nav>

<main>
  {@render children()}
</main>
