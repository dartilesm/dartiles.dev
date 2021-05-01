<script>
    import Post from './Post.svelte'
    import posts from '../routes/blog/_posts.js'
    import { ChevronRightIcon } from 'svelte-feather-icons'

    export let currentPost
    export let temary
    export let isStickySidebar
    export let onTemaryClick
    export let showTemary
    let recommendedPosts = []


    $: recommendedPosts = posts.filter(post => post.title !== currentPost.title).slice(0, 1)
</script>

<style lang="scss">
.sidebar {
    display: block;
    border-radius: 4px;
    padding: 15px;
    box-sizing: border-box;
    .sidebar__container {
        &.sticky {
            position: sticky;
            top: 15px;
        }
        .sidebar__temary-container {
            .sidebar__temary-list {
                list-style: none;
                padding: 0;
                position: relative;
                .sidebar__temary-item {
                    padding-left: 1.2em;
                    cursor: pointer;
                    border-left: 3px solid #0000001f;
                    margin: 5px 0;
                    font-size: .9rem;
                    &.active {
                        color: #0271ef;
                        font-weight: 400;
                        border-left: 3px solid #0271ef;
                    }
                    .sidebar__temary-item-text {
                        margin: 0;
                    }
                }
            }
        }
    }
}
</style>

<div class="sidebar">
    <div class="sidebar__container" class:sticky={isStickySidebar}>
        {#if showTemary}
            <div class="sidebar__temary-container">
                <h3>Temario</h3>
                <ul class="sidebar__temary-list">
                    {#each temary as element}
                        <li class="sidebar__temary-item" class:active={element.isActive} on:click={() => onTemaryClick(element.innerText)}>
                            <p class="sidebar__temary-item-text">{element.innerText}</p>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}
        <div class="Post-container">
            <h3>Otras publicaciones</h3>
            {#each recommendedPosts as post}
                <Post {post}/>
            {/each}
        </div>
    </div>
</div>