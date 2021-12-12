<script>
    import { BookOpenIcon,CalendarIcon,TagIcon } from 'svelte-feather-icons';
    import { timeFormatter } from '../../utils/dateHelper';
    import readingTime from '../../utils/readingTime';
    import Card from '../UI/Card.svelte';


    export let post


</script>

<style lang="scss">
    .post-card {
        font-size: 16px;
        font-weight: 300;
        display: grid;
        justify-content: space-between;
        grid-gap: 5px;
        grid-template-columns: 1fr;
        .post-card__header {
            width: 100%;
            height: 200px;
            border-radius: 5px 5px 0px 0px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
        .post-card__body {
            padding: 10px;
            .post-card__title-container {
                font-size: 20px;
                margin: 0;
                padding: 0;
                .post-card__title {
                    font-size: 1.1em;
                    color: black;
                    margin-bottom: -5px;
                }
                .post-card__details {
                    color: #333;
                    font-size: 13px;
                    font-weight: 300;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    .post-card__details-time, .post-card__details-reading-time {
                        display: inline-flex;
                        align-items: center;
                        font-weight: 500;
                        font-size: 1.1em;
                    }
                    .post-card__details-reading-time {
                        margin: 0 10px;
                    }
                    .post-card__details-tag {
                        background-color: #495460;
                        padding: 0px 5px;
                        margin: 10px 0;
                        border-radius: 4px;
                        font-size: 1em;
                        color: white;
                        font-weight: 400;
                        text-transform: capitalize;
                        display: inline-flex;
                        justify-content: center;
                        align-items: center;
                    }
                }
                .post-card__author {
                    font-size: .7em;
                    display: inline-flex;
                    justify-content: center;
                    align-items: center;
                    font-weight: bold;
                    color: #757575;
                    .post-card__author-bold {
                        color: #000;
                        margin-left: 4px;
                    }
                }
            }

            .post-card__description-container {
                .post-card__description-text {
                    color: #333;
                    font-size: 16px;
                    line-height: 28px;
                    margin: 0px;
                    word-break: break-word;
                }
            }
        }
    }
</style>

<Card toLink="/blog/{post.slug}">
    <div class="post-card">
        <div class="post-card__header" style="background-image: url(/{post.image})">
        </div>
        <div class="post-card__body">
            <div class="post-card__title-container">
                <h3 class="post-card__title">
                    {post.title}
                </h3>
                <span class="post-card__author">
                    por <span class="post-card__author-bold">{post.primary_author?.name}</span>
                </span>
                <div class="post-card__details">
                    <time  class="post-card__details-time" datetime={post.published_at}>
                        <CalendarIcon size="20" />
                        &nbsp;&nbsp;{timeFormatter(post.published_at)}
                    </time>
                    <span class="post-card__details-reading-time">
                        <BookOpenIcon size="20" />
                        &nbsp;&nbsp;{readingTime(post.html)}
                    </span>
                    {#if post.primary_tag?.name}
                        <span class="post-card__details-tag">
                            <TagIcon size="13"/>
                            &nbsp;&nbsp;{post.primary_tag?.name}
                        </span>
                    {/if}
                </div>
            </div>
            <div class="post-card__description-container">
                <p class="post-card__description-text">{post.meta_description || post.excerpt}</p>
            </div>
        </div>
    </div>
</Card>