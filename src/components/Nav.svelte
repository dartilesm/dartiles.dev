<script>
	export let segment;
</script>

<style lang="scss">
	.nav {
		border-bottom: 1px solid rgba(255,0,121,0.2);
		font-weight: 300;
		padding: 0 1em;
		background-color: #fafbfc;
		color: #191a22;
		.nav__container {
			display: grid;
			grid-template-columns: minmax(auto, 1200px);
			justify-content: center;
			align-items: center;
			.nav__content {
				display: flex;
				justify-content: space-between;
				.nav__list {
					margin: 0;
					padding: 0;

					&::after {
						content: '';
						display: block;
						clear: both;
					}
					.nav__item {
						display: block;
						float: left;
						.nav__item-link {
							text-decoration: none;
							padding: 1em;
							display: block;
							font-size: 14px;
							font-weight: 300;
							transition: all 0.3s ease-in-out 0s;
							color: rgba(25, 26, 34, 0.7);

							&::hover {
								color: rgba(25, 26, 34, 1);
							}
							&[aria-current] {
								position: relative;
								display: inline-block;
							}

							&[aria-current]::after {
								position: absolute;
								content: '';
								width: 100%;
								left: 0;
								height: 2px;
								background-color: rgb(255,62,0);
								display: block;
								bottom: -1px;
							}
						}
					}
				}
			}
		}
	}
</style>

<nav class="nav">
	<div class="nav__container">
		<div class="nav__content">
			<div class="nav__social">
				<ul class="nav__list">
					<li class="nav__item">
						<a class="nav__item-link" rel=prefetch aria-current="{segment === undefined ? 'page' : undefined}" href=".">Inicio</a>
					</li>
					<li class="nav__item">
						<a class="nav__item-link" rel=prefetch aria-current="{segment === 'about' ? 'page' : undefined}" href="about">Acerca de mi</a>
					</li>
				</ul>
			</div>
		</div>
	</div>
</nav>
