<script>
    import { createEventDispatcher } from 'svelte'

    export let text
    export let type
    export let link

    const types = {
        primary: 'primary',
        secondary: 'secondary',
        info: 'info',
        warning: 'warning',
        disabled: 'disabled',
        danger: 'danger'
    }
    
    const disptach = createEventDispatcher()

    const emitClick = () => { 
        console.log('Se está dando click') 
        disptach('click')
    }
</script>

<style lang="scss">
    a, button {
        border: none;
        padding: 8px 10px;
        border-radius: 5px;
        text-transform: uppercase;
        font-weight: 500;
        cursor: pointer;
        box-sizing: border-box;
        min-width: 100px;
        height: 35px;
        box-sizing: border-box;
        box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.4);
        transition: background-color ease .2s, 
                    color ease .2s,
                    box-shadow ease .2s;
        &:hover {
            box-shadow: 0px 0px 15px 0px rgba(0,0,0,0.5);
        }
        &.primary {
            background-color: #1f23ff;
            color: white;
        }
        &.secondary {
            background-color: white;
            border: 1px solid #212121;
            color: black;
            box-shadow: none;
            &:hover {
                background-color: rgb(0, 0, 0);
                color: white;
                border: none;
            }
        }
    }
</style>

{#if link}
    <a href={link} class={types[type] || types.primary}>{text}</a>
{:else}
    <button type="button" class={types[type] || types.primary} on:click={emitClick}>{text}</button>
{/if}