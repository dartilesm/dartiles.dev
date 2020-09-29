<script>
    import { ToolIcon } from 'svelte-feather-icons'
</script>
<style>
    .Footer {
        background: rgba(28, 41, 56, 0.8);
        color: white;
        padding: 1.5em 0;
        margin: 0;
        font-size: 13px;
        padding: 16px;
        font-weight: 300;
    }

    .Footer-container {
        display: grid;
        grid-template-columns: minmax(auto, 1200px);
        justify-content: center;
        align-items: center;
    }

    .Footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .Footer-svelte {
        display: flex;
        align-items: center;
    }

    .Footer-svelte img {
        margin: 0 0 0 0.5em;
    }
</style>

<footer class="Footer">
    <div class="Footer-container">
        <div class="Footer-content">
            <div class="Footer-svelte">Sitio desarrollado con Svelte
                <img src="svelte.png" alt="Svelte">
            </div>
            <div class="Footer-svelte">Sitio en construcción 
                <ToolIcon size="24" />
            </div>
        </div>
    </div>
</footer>