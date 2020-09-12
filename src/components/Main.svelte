<script>
    import Sidebar from './Sidebar.svelte'
</script>

<style>
    .Main-container {
        display: grid;
        grid-template-columns: minmax(auto, 1024px);
        justify-content: center;
        align-items: center;
    }
    .Main-content {
        margin: 2em 0 0 0;
        display: grid;
        grid-template-columns: 3fr 1fr;
        padding: 0 1em;
        grid-gap: 60px;
        justify-content: space-between;
    }

    @media screen and (max-width: 576px) {
        .Main-content {
            grid-template-columns: 3fr;
        }
    }
</style>

<main class="main">
    <div class="Main-container">
        <div class="Main-content">
            <slot />
            <Sidebar />
        </div>
    </div>
</main>