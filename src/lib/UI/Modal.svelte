<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte'
    import { fly } from 'svelte/transition'
    import { XIcon } from 'svelte-feather-icons'
    import { portal } from 'svelte-portal/src/Portal.svelte'
    import Button from './Button.svelte'


    export let options = {}

    const defaultOptions = {
        canCloseOnClickOutside: true,
        title: '',
        primaryText: '',
        secondaryText: ''
    }
    
    $: options = {
        ...defaultOptions,
        ...options || {}
    }

    let modalContainer
    let prevBodyPosition
    let prevBodyOverflow

    const dispatch = createEventDispatcher()

    const closeOnClickOutside = ({ target: element, force = false}) => {
        const isValidClassName = typeof element?.className === 'string'
        if (options.canCloseOnClickOutside && (isValidClassName && element.className.includes('modal-background') || force)) dispatch('close')
    }

    const disableScroll = () => {
        prevBodyPosition = document.body.style.position;
        prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    };

    const enableScroll = () => {
        document.body.style.position = prevBodyPosition || '';
        document.body.style.overflow = prevBodyOverflow || '';
    };

    const handleAction = type => dispatch(`${type}Click`)

    onMount(() => {
        disableScroll()
    })

    onDestroy(() => {
        enableScroll()
    })
</script>

<style lang="scss">
    @import 'queries';
    .modal-background {
        position: fixed;
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
        top: 0;
        background-color: rgba(0, 0, 0, .7);
        .modal-container {
            position: relative;
            height: 500px;
            min-width: 200px;
            max-height: calc(100vh - 20%);
            height: auto;
            background-color: white;
            border-radius: 5px;
            @include for-size-up(extra-small) {
                max-width: calc(100vw - 20%);
            }
            @include for-size(extra-small) {
                height: auto;
                width: 90%;
                border: none;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-sizing: border-box;
                position: relative;
                width: 100%;
                padding: 10px;
                border-bottom: 1px solid rgba(181, 181, 181, .2);
                .modal-title-container {
                    display: contents;
                    .modal-title {
                        margin: 0;
                        color: black;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                    }
                }
                .header-close-button {
                    display: flex;
                    padding: 5px;
                    cursor: pointer;
                }
            }
            .modal-body {
                min-height: 50px;
                padding: 10px;
            }
            .modal-footer {
                display: flex;
                justify-content: center;
                align-items: center;
                box-sizing: border-box;
                position: relative;
                width: 100%;
                bottom: 0;
                padding: 10px;
                border-top: 1px solid rgba(181, 181, 181, .2);
                :global(Button) {
                    margin: 0px 10px;
                }
            }
        }
    }
</style>

<div class="modal-background" use:portal on:click={closeOnClickOutside}>
    <div class="modal-container" bind:this={modalContainer} transition:fly="{{ y: -20, duration: 300 }}">
        <div class="modal-header">
            <div class="modal-title-container">
                {#if options.title}
                    <h3 class="modal-title">{options.title}</h3>
                {/if}
            </div>
            <span class="header-close-button" on:click={() => closeOnClickOutside({ force: true })}>
                <XIcon size="20" />
            </span>
        </div>
        <div class="modal-body">
            <slot></slot>
        </div>
        {#if options.primaryText || options.secondaryText}
            <div class="modal-footer">
                {#if options.secondaryText}
                    <Button text={options.secondaryText} type="secondary" on:click={() => handleAction('secondary')}/>
                {/if}
                {#if options.primaryText}
                    <Button text={options.primaryText} on:click={() => handleAction('primary')}/>
                {/if}
            </div>
        {/if}
    </div>
</div>