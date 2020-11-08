<script>
    import { goto } from '@sapper/app';
    import Card from './Card.svelte'
    import readingTime from '../utils/readingTime';
    import { timeFormatter } from '../utils/dateHelper';
    import { CalendarIcon, BookOpenIcon, TagIcon } from 'svelte-feather-icons'
    export let post

    const navigateTo = () => goto(`blog/${post.slug}`)



</script>

<style>
    /* @import url('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.2.0/styles/atom-one-dark.min.css'); */
    .Post-item {
        color: #191a22;
        position: relative;
        cursor: pointer;
        border-radius: 5px;
        background-color: white;
        -webkit-box-shadow: 0 8px 30px rgba(0,0,0,.12);
        -moz-box-shadow: 0 8px 30px rgba(0,0,0,.12);
        box-shadow: 0 8px 30px rgba(0,0,0,.12);
    }
    .Post-item:hover {
        -webkit-box-shadow: 0 8px 30px rgba(0,0,0,.2);
        -moz-box-shadow: 0 8px 30px rgba(0,0,0,.2);
        box-shadow: 0 8px 30px rgba(0,0,0,.2);
    }
    .Post-image {
        width: 100%;
        height: 200px;
        border-radius: 5px 5px 0px 0px;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
    }
    .Post-content {
        font-size: 16px;
        font-weight: 300;
        display: grid;
        justify-content: space-between;
        grid-gap: 5px;
        grid-template-columns: 1fr;
    }

    .Post-content h3 {
        font-size: 1.1em;
        color: black;
    }
    .Post-head {
        padding: 10px;
    }
    .Post-title {
        font-size: 20px;
        margin: 0;
        padding: 0;
    }
    .Post-title p {
        color: #333;
        font-size: 13px;
        font-weight: 300;
        margin-top: 5px;
        padding: 0;
    }
    .Post-title p time, .Post-title p span, .Post-title span {
        display: inline-flex;
        align-items: center;
    }
    .Post-title span.tag {
        background-color: #000;
        padding: 3px 5px;
        border-radius: 4px;
        font-size: .6em;
        color: white;
        font-weight: 500;
        text-transform: capitalize;
    }
    .Post-title p span {
        margin-left: 10px;
    }
    .Post-title p span, .Post-title p time {
        font-weight: 500;
        font-size: 1.1em;
    }
    .Post-desc p {
        color: #333;
        font-size: 16px;
        line-height: 28px;
        margin: 0px;
        word-break: break-word;
    }
</style>

<Card onClick="{navigateTo}">
    <div class="Post-content">
        <div class="Post-image" style="background-image: url({post.image})">
        </div>
        <div class="Post-head">
            <div class="Post-title">
                <h3>
                    {post.title}
                </h3>
                <span class="tag">
                    <TagIcon size="14"/>
                    &nbsp;&nbsp;{post.primary_tag.name}
                </span>
                <p>
                    <time datetime={post.published_at}>
                        <CalendarIcon size="20" />
                        &nbsp;&nbsp;{timeFormatter(post.published_at)}
                    </time>
                    <span>
                        <BookOpenIcon size="20" />
                        &nbsp;&nbsp;{readingTime(post.html)}
                    </span>
                </p>
            </div>
            <div class="Post-tags"></div>
            <div class="Post-desc">
                <p>{post.meta_description || post.excerpt}</p>
            </div>
        </div>
    </div>
</Card>