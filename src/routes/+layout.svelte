<script>
  import './styles.css';
  const { children } = $props();
</script>

<nav>
  <a href="actions">Actions</a>
  <a href="transaction">Transaction</a>
  <a href="snapshot">Snapshot</a>
</nav>

<main>
  {@render children()}
</main>
