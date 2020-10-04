<script>
    import Post from './Post.svelte'
    import posts from '../routes/blog/_posts.js'
    import { ChevronRightIcon } from 'svelte-feather-icons'

    export let currentPost
    export let temary
    export let isStickySidebar
    export let onTemaryClick
    let recommendedPosts = []


    $: recommendedPosts = posts.filter(post => post.title !== currentPost.title).slice(0, 2)
</script>

<style>
    .Sidebar-container {
        display: block;
        border-radius: 4px;
        padding: 15px;
        box-sizing: border-box;
    }
    .Sidebar.sticky {
        position: sticky;
        top: 15px;
    }

    .Temary-list {
        list-style: none;
        padding: 0;
        position: relative;
    }

    .Temary-list li {
        padding-left: 1.2em;
        transition: ease-in all .25s;
    }

    .Temary-list li.active {
        color: #0271ef;
        font-weight: 500;
        font-size: 1.3rem;
    }

    .Temary-list li .Temary-list-icon {
        position: absolute;
        left: -8px;
    }
    .Temary-list li p {
        margin: 0;
    }
</style>

<div class="Sidebar-container">
    <div class="Sidebar {isStickySidebar ? 'sticky' : ''}">
        <div class="Temary-container">
            <h2>Temario</h2>
            <ul class="Temary-list">
                {#each temary as element}
                <li class={element.isActive ? 'active' : ''} on:click={() => onTemaryClick(element.innerText)}>
                    <span class="Temary-list-icon"><ChevronRightIcon class="Temary-list-icon" size="1.5x"/></span>
                    <p>{element.innerText}</p>
                </li>
                {/each}
            </ul>
        </div>
        <div class="Post-container">
            <h2>Otras publicaciones</h2>
            {#each recommendedPosts as post}
                <Post {post}/>
            {/each}
        </div>
    </div>
</div>