<script>
    import { sendEventGA } from '../utils/analytics';
    import { GithubIcon, TwitterIcon, LinkedinIcon } from 'svelte-feather-icons';
    import Button from './UI/Button.svelte'
    import Modal from './UI/Modal.svelte'

    export let segment
    let showModal = false
    const modalOptions = {
        title: '¡Realiza tu primer post en Dartiles!',
        primaryText: 'Aceptar',
    }
    

    const toggleModal = () => {
        showModal = !showModal 
        console.log(showModal)
    }
</script>

<style lang="scss">
    .header__container {
        background-color: #fff;
        color: #191a22;
        padding: 1em;
        display: grid;
        grid-template-columns: minmax(auto, 1200px);
        justify-content: center;
        align-items: center;
        border-bottom: 1px solid rgba(24, 28, 248, 0.2);
        .header__content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            .header__logo-container {
                display: inline-flex;
                align-items: center;
                text-decoration: none;
                .header__title {
                    color: #000;
                    font-size: 20px;
                    font-weight: 900;
                    letter-spacing: 0.8px;
                    cursor: pointer;
                    width: 150px;
                    margin: 0 0 0 5px;
                    font-family: 'Hammersmith One', sans-serif;
                    text-shadow: 0 0 black;
                }
            }
            .header__right {
                display: flex;
                align-items: center;
                :global(Button) {
                    margin-right: 1em;
                }
                .header__social {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    display: flex;
                    .header__social-item {
                        display: inline-block;
                        margin: 0 .5em 0 .5em
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
    }
</style>

<header class="header">
    <div class="header__container">
        <div class="header__content">
            <a href="." rel="prefetch" class="header__logo-container">
                <img class="header__logo" src="logo.png" alt="logo" style="max-width: 35px"/>
                <h1 class="header__title">Dartiles</h1>
            </a>
            <div class="header__right">
                <Button text="Redactar" on:click={toggleModal}/>
                <ul class="header__social">
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

{#if showModal}
    <Modal on:close={toggleModal} options={modalOptions} on:primaryClick={toggleModal}>
            <p>Actualmente estamos trabajando para ofrecer la posibilidad de crear publicaciones directamente desde <b>dartiles</b>, pero si estás interesado en publicar articulos aquí dejama tu correo electrónico y te daré acceso a una plataforma fácil e intuitiva para que compartas tus artículos.</p>
    </Modal>
{/if}