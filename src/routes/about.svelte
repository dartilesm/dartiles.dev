<script>
	import { onMount } from 'svelte'
	import ProfilePhoto from '../../static/media/about-me/me.jpg'
	import Card from '../components/Card.svelte';
	import { MailIcon, MapPinIcon, UserIcon } from 'svelte-feather-icons'
	import { calculateAge } from '../utils/dateHelper';
	let viewportHeight = ''
	const birthDate = new Date(1998,4,13)

	onMount(() => {
		if (document.readyState === 'complete') viewportHeight = `${window.innerHeight}px`

		document.addEventListener('readystatechange', () => {
			viewportHeight = document.readyState === 'complete' ?  `${window.innerHeight}px` : '100vh'
		})
	})
</script>
<style>
	.About {
		padding: 10px 0;
		min-height: calc(var(--viewport-height) - 205px);
	}

	.About .profile-photo {
		border-radius: 4px 0 0 4px;
		width: 100%;
		height: 100%;
	}

	.About .inner-container {
		display: flex;
	}
	.About :global(.Card-container:not(:first-child) > .inner-container) {
		display: flex;
		flex-direction: column;
    	padding: 30px;
	}
	.About .inner-container .inner-header, .About .inner-container .inner-footer {
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.About .inner-container .inner-footer h4 a {
		color:#0271ef;
		text-decoration: none;
	}
	.About .inner-container .inner-footer h4 {
		text-align: center;
	}

	.About .inner-container .profile-photo-container {
		max-width: 400px;
		position: relative;
	}
	.About .inner-container .profile-main-info-container {
		padding: 20px;
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		box-sizing: border-box;
	}
	.About .inner-container .profile-info-detail-row {
		display: flex;
	}
	.About .inner-container .profile-info-detail-row .left {
		display: flex;
		align-items: center;
		margin: 10px 0;
		width: 200px;
	}
	.About .inner-container .profile-info-detail-row .right {
		display: flex;
		align-items: center;
		margin: 10px 0;
	}
	.About .inner-container .profile-info-detail-row .right h4 {
		margin: 0;
	}
	.About .inner-container .profile-info-detail-row .right h4 a {
		text-decoration: none;
		color: #0271ef;
	}
	.About .inner-container .profile-info-detail-row .left h4 {
		margin: 0 0 0 10px;
		font-weight: bold;
	}

	.About :global(.Card-container:not(:first-child)) {
		margin-top: 10px;
	}

	@media screen and (max-width: 768px) {
		.About .inner-container {
			display: flex;
			flex-direction: column;
		}
		.About .inner-container .profile-info-container {
			width: 100%;
		}
		.About .inner-container .profile-info-container .profile-info-detail-row {
			display: flex;
			justify-content: space-between;
		}
		.About .profile-photo {
			border-radius: 4px 4px 0 0;
		}
		
		.About :global(.Card-container) {
			max-width: 400px;
			margin: auto;
		}
	}

	@media screen and (max-width: 992px) {
		.About {
			padding: 10px;
		}
	}
	
	@media screen and (max-width: 576px) {
		.About .inner-container .profile-info-container .profile-info-detail-row {
			flex-direction: column;
			margin: 10px 0;
			position: relative;
		}
		.About .inner-container .profile-info-container .profile-info-detail-row .left h4 {
			margin: 0;
		}
		.About .inner-container .profile-info-container .profile-info-detail-row .left, .About .inner-container .profile-info-container .profile-info-detail-row .right {
			margin: 0 0 0 35px;
		}
		.About .inner-container .profile-info-container .profile-info-detail-row .left :global(.icon) {
			position: absolute;
			top: 50%;
			left: 0;
			transform: translateY(-50%)
		}
	}
</style>

<svelte:head>
	<title>Diego Artiles - Frontend Developer | Acerca de mi</title>

	<meta name="description" content="En esta sección te cuento un poco sobre mi carrera y mi experiencia">

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@dartilesm" />
	<meta name="twitter:creator" content="@dartilesm" />
	<meta name="twitter:title" content="Diego Artiles - Frontend Developer | Acerca de mi" />
	<meta name="twitter:description" content="En esta sección te cuento un poco sobre mi carrera y mi experiencia" />
	<meta name="twitter:image" content="https://dartiles.dev/media/main/main-image.jpg" />
	
	<meta property="og:title" content="Diego Artiles - Frontend Developer | Acerca de mi" />
	<meta property="og:site_name" content="Dartiles Dev" />
	<meta property="og:description" content="En esta sección te cuento un poco sobre mi carrera y mi experiencia" />
	<meta property="og:image" content="https://dartiles.dev/media/main/main-image.jpg" />
	<meta property="og:url" content="https://dartiles.dev/about" />
	<meta property="og:locale" content="es_ES">
	<meta property="og:type" content="article">
</svelte:head>

<div class="About" style="--viewport-height: {viewportHeight}">
	<Card>
		<div class="inner-container">
			<div class="profile-photo-container">
				<img src={ProfilePhoto} alt="me" class="profile-photo"/>
			</div>
			<div class="profile-main-info-container">
				<div>
					<h1>Hola 👋, soy Diego Artiles</h1>
					<h3>Frontend Developer</h3>
					<br>
					<div class="profile-info-container">
						<div class="profile-info-detail-row">
							<div class="left">
								<MailIcon size="24" class="icon" />
								<h4>Correo Electrónico:</h4>
							</div>
							<div class="right">
								<h4>
									<a href="mailto:contact@dartiles.dev">contact@dartiles.dev</a>
								</h4>
							</div>
						</div>
						<div class="profile-info-detail-row">
							<div class="left">
								<MapPinIcon size="24" class="icon" />
								<h4>Ubicación:</h4>
							</div>
							<div class="right">
								<h4>
									Buenos Aires, Argentina
								</h4>
							</div>
						</div>
						<div class="profile-info-detail-row">
							<div class="left">
								<UserIcon size="24" class="icon" />
								<h4>Edad:</h4>
							</div>
							<div class="right">
								<h4>
									{calculateAge(birthDate)} años
								</h4>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Card>
	<Card>
		<div class="inner-container">
			<div class="inner-header">
				<h2>Acerca de Mi</h2>
			</div>
			<div class="inner-body">
				<p>
					Soy desarrollador frontend con más de 4 años de experiencia aproximadamente mi principal stack es javascript, tengo experiencia con <b>Angular</b> en sus distintas versiones (JS y 2+), <b>React</b> y <b>Svelte</b> 👨‍💻.
					<br><br>
					Gran parte de mi carrera estuve trabajando con Angular y este último año estoy trabajando con React y más recientemente (y simultáneamente) estoy trabajando con svelte para desarrollador mi sitio personal ❤️.
					<br><br>
					En el backend he usado NodeJS con express y también he usado el framework <b>NestJS</b> y en mobile trabaje con <b>Ionic</b> y <b>React Native</b> 📱.
					<br><br>
					Personalmente soy una persona muy detallista y muy creativo, se me da muy bien encontrar errores y solucionar problemas 😁. Amo las buenas prácticas y el código limpio.
				</p>
			</div>
			<div class="inner-footer">
				<h4>
					<a href="https://linkedin.com/in/dartiles/" rel="noreferrer" target="_blank">
						<b>Para ver información más detallada y acualizada visita mi perfil en LinkedIn</b>
					</a>
				</h4>
			</div>
		</div>
	</Card>
</div>

