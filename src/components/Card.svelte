<script>
    export let onClick
</script>

<style lang="scss">
    @import 'general';
    .Card-container {
        color: #191a22;
        position: relative;
        border-radius: 5px;
        background-color: white;
        @include box-shadow(rgba(0,0,0,.12));
        &.is-clickeable {
            cursor: pointer;
        }
        &:hover {
            @include box-shadow(rgba(0,0,0,.2));
        }
    }
</style>

<div class="Card-container" on:click={onClick} class:is-clickeable={!!onClick}>
    <slot></slot>
</div>