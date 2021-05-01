<script>
    import { sendEventGA } from '../utils/analytics';
    import { GithubIcon, TwitterIcon, LinkedinIcon } from 'svelte-feather-icons'
</script>

<style lang="scss">
    .header__container {
        background-color: #fafbfc;
        color: #191a22;
        padding: 1em;
        display: grid;
        grid-template-columns: minmax(auto, 1200px);
        justify-content: center;
        align-items: center;
        .header__content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            .header__title {
                color: #191a22;
                font-size: 20px;
                font-weight: 700;
                letter-spacing: 0.8px;
                cursor: pointer;
                width: 150px;
                .header__description {
                    display: block;
                    font-size: 13px;
                    font-weight: 300;
                    letter-spacing: normal;
                    margin-top: 0.3em 0 0 0;
                }
            }
            .header__social-list {
                margin: 0;
                padding: 0;
                list-style: none;
                .header__social-item {
                    display: inline-block;
                    margin: 0 0.5em 0 0;
                }
                .header__social-link {
                    display: flex;
                    align-items: center;
                    border-radius: 17px;
                    color: black;
                    text-decoration: none;
                    font-weight: 300;
                    font-size: 14px;
                }
            }
        }
    }
</style>

<header class="header">
    <div class="header__container">
        <div class="header__content">
            <div class="header__logo">
                <h1 class="header__title">
                    Diego Artiles
                    <span class="header__description">Frontend Developer</span>
                </h1>
            </div>
            <div class="header__social">
                <ul class="header__social-list">
                    <li class="header__social-item">
                        <a class="header__social-link header__social-link--twitter" href="https://twitter.com/intent/follow?screen_name=dartilesm" target="_blank" rel="noreferrer" on:click={sendEventGA('social', 'header', 'twitter-button')}>
                            <TwitterIcon  size="24" />
                        </a>
                    </li>
                    <li class="header__social-item">
                        <a class="header__social-link header__social-link--linkedin" href="https://www.linkedin.com/in/dartiles/" target="_blank" rel="noreferrer" on:click={sendEventGA('social', 'header', 'linkedin-button')}>
                            <LinkedinIcon  size="24" />
                        </a>
                    </li>
                    <li class="header__social-item">
                        <a class="header__social-link header__social-link--github" href="https://github.com/dartilesm/" target="_blank" rel="noreferrer" on:click={sendEventGA('social', 'header', 'github-button')}>
                             <GithubIcon  size="24" />
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</header>