<script>
    import { sendEventGA } from '../utils/analytics';
    import { GithubIcon, TwitterIcon, LinkedinIcon } from 'svelte-feather-icons'
</script>

<style>
    .Header-container {
        background-color: #fafbfc;
        color: #191a22;
        padding: 1em;
    }
    .Header-container {
        display: grid;
        grid-template-columns: minmax(auto, 1200px);
        justify-content: center;
        align-items: center;
    }
    .Header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .Header h1 {
        color: #191a22;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.8px;
        cursor: pointer;
        width: 150px;
    }
    .Header h1 span {
        display: block;
        font-size: 13px;
        font-weight: 300;
        letter-spacing: normal;
        margin-top: 0.3em 0 0 0;
    }
    .Header ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .Header li {
        display: inline-block;
        margin: 0 0.5em 0 0;
    }
    .Header a {
        text-decoration: none;
        font-weight: 300;
        font-size: 14px;
    }
    .Header a:active {
        transform: scale(.9);
    }
    .Header a span {
        margin-right: 5px;
    }
    .Header .twitter {
        display: flex;
        align-items: center;
        /* padding: 10px 15px; */
        border-radius: 17px;
        /* background: #1da1f2;
        color: white; */
        color: black;
    }
    .Header .linkedin {
        display: flex;
        align-items: center;
        /* padding: 10px 15px; */
        border-radius: 17px;
        /* background: #0077b5;
        color: white; */
        color: black;
    }
    .Header .github {
        display: flex;
        align-items: center;
        /* padding: 10px 15px; */
        border-radius: 17px;
        /* background: #000000;
        color: white; */
        color: black;
    }

    @media screen and (max-width: 576px) {
        .Header a {
            color: black;
        }
        .Header span {
            display: none;
        }
    }
</style>

<header class="Header">
    <div class="Header-container">
        <div class="Header-content">
            <div class="Header-logo">
                <h1>
                    Diego Artiles
                    <span>Frontend Developer</span>
                </h1>
            </div>
            <div class="Header-social">
                <ul>
                    <li>
                        <a class="twitter" href="https://twitter.com/intent/follow?screen_name=dartilesm" target="_blank" rel="noreferrer" on:click={sendEventGA('social', 'header', 'twitter-button')}>
                            <TwitterIcon  size="24" />
                        </a>
                    </li>
                    <li>
                        <a class="linkedin" href="https://www.linkedin.com/in/dartiles/" target="_blank" rel="noreferrer" on:click={sendEventGA('social', 'header', 'linkedin-button')}>
                            <LinkedinIcon  size="24" />
                        </a>
                    </li>
                    <li>
                        <a class="github" href="https://github.com/dartilesm/" target="_blank" rel="noreferrer" on:click={sendEventGA('social', 'header', 'github-button')}>
                             <GithubIcon  size="24" />
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</header>