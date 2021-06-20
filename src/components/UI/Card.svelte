<script>
    import { createEventDispatcher } from 'svelte'
    const disptach = createEventDispatcher()

    const emitClick = disptach('click')
    export let toLink
    export let isClickeable
</script>

<style lang="scss">
    @import 'general';
    .Card-container {
        color: #191a22;
        position: relative;
        border-radius: 5px;
        background-color: white;
        text-decoration: none;
        @include box-shadow(rgba(0,0,0,.12));
        &.is-clickeable {
            cursor: pointer;
        }
        &:hover {
            @include box-shadow(rgba(0,0,0,.2));
        }
    }
</style>
{#if toLink}
<a rel="prefetch" href={toLink} class="Card-container is-clickeable">
    <slot></slot>
</a>
{:else}
<div class="Card-container" on:click={emitClick} class:is-clickeable={!!isClickeable}>
    <slot></slot>
</div>
{/if}
