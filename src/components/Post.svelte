<script>
    import readingTime from '../utils/readingTime'
    import randomEmojis from '../utils/randomEmoji'
    import timeFormatter from '../utils/timeFormater'
    import { goto } from '@sapper/app';

    const navigateTo = path => {
        goto(path);
    }

    export let post
</script>

<style>
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
    .Post-desc p {
        color: #333;
        font-size: 16px;
        line-height: 28px;
        margin: 0px;
        word-break: break-word;
    }
    .dot {
        font-weight: 700;
    }
</style>

<div class="Post-item" on:click="{navigateTo(`blog/${post.slug}`)}">
    <div class="Post-content">
        <div class="Post-image" style="background-image: url({post.image})">
        </div>
        <div class="Post-head">
            <div class="Post-title">
                <h3>
                    {post.title}
                </h3>
                <p>
                    <time datetime={post.published_at}>📅 {timeFormatter(post.published_at)}</time>
                    <span class="dot">.</span>
                    <span>{readingTime(post.html)}</span>
                </p>
            </div>
            <div class="Post-tags"></div>
            <div class="Post-desc">
                <p>{post.desc}</p>
            </div>
        </div>
    </div>
</div>