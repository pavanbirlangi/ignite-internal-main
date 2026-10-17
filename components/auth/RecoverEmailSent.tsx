import Mailsent from '../icons/Mailsent'

export function RecoverEmailSent() {
    return (
        <div className="flex flex-col items-center justify-center py-2 text-center">
            {/* Icon SVG */}
            <div className="bg-primary/10 mb-5 grid size-16 place-items-center rounded-full [&_svg]:size-8">
               <Mailsent/>
            </div>

            <p className="text-sm text-white/65">
                If you have an account with us, we have sent a password reset link to your email.
                <br />
                Please check your inbox and follow the instructions to reset your password.
            </p>
        </div>
    )
}
