<script>
    export let onClick
</script>

<style>
    .Card-container {
        color: #191a22;
        position: relative;
        border-radius: 5px;
        background-color: white;
        -webkit-box-shadow: 0 8px 30px rgba(0,0,0,.12);
        -moz-box-shadow: 0 8px 30px rgba(0,0,0,.12);
        box-shadow: 0 8px 30px rgba(0,0,0,.12);
    }
    .Card-container:hover {
        -webkit-box-shadow: 0 8px 30px rgba(0,0,0,.2);
        -moz-box-shadow: 0 8px 30px rgba(0,0,0,.2);
        box-shadow: 0 8px 30px rgba(0,0,0,.2);
    }
    .Card-container.is-clickeable {
        cursor: pointer;
    }
</style>

<div class="Card-container" on:click={onClick} class:is-clickeable={!!onClick}>
    <slot></slot>
</div>