<style>
    .main {
        background: #f3f3f3;
    }

    .Main-container {
        position: relative;
        display: grid;
        grid-template-columns: minmax(auto, 1200px);
        justify-content: center;
        align-items: center;
    }
    .Main-content {
        display: grid;
        grid-template-columns: 3fr;
        padding: 0 1em;
        grid-gap: 60px;
        justify-content: space-between;
    }

    @media screen and (max-width: 576px) {
        .Main-container {
            display: block;
        }
        .Main-content {
            display: block;
            padding: 0;
        }
    }
</style>

<main class="main">
    <div class="Main-container">
        <div class="Main-content">
            <slot />
        </div>
    </div>
</main>