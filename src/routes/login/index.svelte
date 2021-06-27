<script>
    import { goto } from '@sapper/app';
    import Auth from '../../components/Auth/Auth.svelte';

    const onSuccessLogin = () => goto('/')
</script>

<style lang="scss">

    div {
        position: relative;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>

<div >
    <Auth isLogin={true} on:success={onSuccessLogin} />
</div>