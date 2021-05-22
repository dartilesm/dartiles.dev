<script>
    import { ToolIcon } from 'svelte-feather-icons'
</script>
<style lang="scss">
    .footer {
        background: rgba(28, 41, 56, 0.8);
        color: white;
        padding: 1.5em 0;
        margin: 0;
        font-size: 13px;
        padding: 16px;
        font-weight: 300;
        .footer__container {
            display: grid;
            grid-template-columns: minmax(auto, 1200px);
            justify-content: center;
            align-items: center;
            .footer__content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                .footer__svelte {
                    display: flex;
                    align-items: center;
                    .footer__svelte-logo {
                        margin: 0 0 0 0.5em;
                    }
                }

            }
        }
    }



</style>

<footer class="footer">
    <div class="footer__container">
        <div class="footer__content">
            <div class="footer__svelte">
                <p>Sitio desarrollado con Svelte</p>
                <img class="footer__svelte-logo" src="svelte.png" alt="Svelte">
            </div>
            <div class="footer__svelte">
                <p>Sitio en construcción</p>
                <ToolIcon size="24" />
            </div>
        </div>
    </div>
</footer>