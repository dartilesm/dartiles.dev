<style lang="scss">
    @import 'queries';
    .main {
        background: #f3f3f3;
        min-height: 100vh;
        .main__container {
            position: relative;
            display: grid;
            grid-template-columns: minmax(auto, 1200px);
            justify-content: center;
            align-items: center;
            @include for-size(medium) {
                display: block;
            }
            .main__content {
                display: grid;
                grid-template-columns: 3fr;
                padding: 0 1em;
                grid-gap: 60px;
                justify-content: space-between;
                @include for-size(medium) {
                    display: block;
                    padding: 0;
                }
            }
        }
    }
</style>

<main class="main">
    <div class="main__container">
        <div class="main__content">
            <slot />
        </div>
    </div>
</main>