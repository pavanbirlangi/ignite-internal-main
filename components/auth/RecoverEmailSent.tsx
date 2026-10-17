import Mailsent from '../icons/Mailsent'

export function RecoverEmailSent() {
    return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
            {/* Icon SVG */}
            <div className="mb-8">
               <Mailsent/>
            </div>

            <p className="text-white/65 text-base font-medium">
                If you have an account with us, we have sent a password reset link to your email.
                <br />
                Please check your inbox and follow the instructions to reset your password.
            </p>
        </div>
    )
}
