<script>
    import Card from '../UI/Card.svelte'
    import Button from '../UI/Button.svelte'
    import { createEventDispatcher } from 'svelte';
    import authService from '../../services/api/auth'

    export let isLogin

    let link
    $: link = isLogin ? '/register' : '/login'

    const user = {
        name: '',
        email: '',
        password: ''
    }

    const dispatch = createEventDispatcher()
    const handleForm = async () => {
        const { name, ...loginUser } = user
        const { data: response, error } = isLogin ? await authService.login(loginUser) : await authService.register(user)
        const { access_token } = response?.data || {}
        access_token && localStorage.setItem('token', access_token)
        response && dispatch('success', response)
        error && dispatch('error', error)
    }


    let canActive = () => null
    $: {
        canActive = () => {
            const userDataKeys = Object.keys(user)
            const isUserDataFilled = userDataKeys
                .filter(userDataKey => (isLogin && userDataKey !== 'name') || !isLogin)
                .every(userDataKey => user[userDataKey])
            return isUserDataFilled
        }
    }

</script>

<style lang="scss">
    @import 'variables';

    :global(.auth-card) {
        padding: 20px;
        min-width: 300px;
    }
    .header {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        img {
            width: 35px;
            margin: 10px 0;
        }
    }
    form {
        display: flex;
        flex-direction: column;
        input {
            padding: 10px;
            outline: none;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
        }
    }
    a {
        text-decoration: none;
        color: $primary-color;
        text-align: center;
    }
</style>

<Card class="auth-card">
    <div class="header">
        <img src="logo3.png" alt="dartiles logo">
        <h1>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h1>
    </div>
    <form >
        {#if !isLogin}
             <label for="name">Nombre</label>
             <input type="name" id="name" placeholder="your name" bind:value={user.name}>
        {/if}
        <label for="email">Correo Electrónico</label>
        <input type="text" id="email" placeholder="yourname@test.com" bind:value={user.email}>
        <label for="password">Contraseña</label>
        <input type="password" id="password" placeholder="your password" bind:value={user.password}>
        <Button text="Entrar" on:click={handleForm} disabled={!canActive()}/>
        <hr>
        <a href={link} rel="prefetch">{isLogin ? 'No tengo cuenta' : 'Ya tengo cuenta'}</a>
    </form>
</Card>