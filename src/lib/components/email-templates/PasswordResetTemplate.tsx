import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Section,
	Text
} from '@react-email/components';
import { PUBLIC_HOST } from '$env/static/public';

interface Props {
	resetLink: string;
}

export const PasswordResetTemplate = ({ resetLink }: Props) => (
	<Html>
		<Head />
		<Preview>BRAAND - Възстановяване на парола</Preview>
		<Body style={main}>
			<Container style={container}>
				<Img
					src={`${PUBLIC_HOST}/logos/logo-icon-128x128.png`}
					width={48}
					height={48}
					alt="BRAAND Platform"
				/>
				<Heading style={heading}>Последвайте линка по-долу, за да възстановите паролата си</Heading>
				<Section style={body}>
					<Text style={paragraph}>
						<Link style={link} href={resetLink}>
							👉 Натисни тук 👈
						</Link>
					</Text>
				</Section>
				<Text style={paragraph}>
					Поздрави,
					<br />
					Екипът на BRAAND
				</Text>

				<Hr style={hr} />

				<Text style={footerCopyright}>
					Това е автоматично генериран имейл, моля не отговаряйте на него. Информация за контакт с
					администраторите на платформата можете да намерите на уебсайта ни.
				</Text>

				<Hr style={hr} />

				<Text style={footerCopyright}>
					Copyright © {new Date().getFullYear()} BRAAND LTD. <br /> Всички права запазени.
				</Text>
			</Container>
		</Body>
	</Html>
);

export default PasswordResetTemplate;

const main = {
	backgroundColor: '#ffffff',
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
	color: '#333333'
};

const container = {
	margin: '0 auto',
	padding: '20px 25px 48px',
	backgroundImage: 'url("/gradient.png")',
	backgroundPosition: 'bottom',
	backgroundRepeat: 'no-repeat, no-repeat'
};

const heading = {
	fontSize: '28px',
	fontWeight: 'bold',
	marginTop: '48px'
};

const body = {
	margin: '24px 0'
};

const paragraph = {
	fontSize: '16px',
	lineHeight: '26px'
};

const link = {
	color: '#FF6363'
};

const hr = {
	borderColor: '#dddddd',
	marginTop: '48px'
};

const footerCopyright = {
	margin: '25px 0 0 0',
	textAlign: 'center' as const,
	fontSize: '12px',
	color: 'rgb(102,102,102)'
};
