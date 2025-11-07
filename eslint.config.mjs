import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import pluginImport from 'eslint-plugin-import'

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    'plugin:@tanstack/eslint-plugin-query/recommended',
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    {
        files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],

        plugins: {
            import: pluginImport
        },

        rules: {
            curly: 'off',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'react/react-in-jsx-scope': 'off',
            '@typescript-eslint/no-explicit-any': 'off',

            // FSD 레이어 간 의존성 규칙
            'import/no-restricted-paths': [
                'error',
                {
                    zones: [
                        { target: './src/renderer/src/pages', from: './src/renderer/src/app' },
                        { target: './src/renderer/src/widgets', from: './src/renderer/src/app' },
                        { target: './src/renderer/src/widgets', from: './src/renderer/src/pages' },
                        { target: './src/renderer/src/features', from: './src/renderer/src/app' },
                        { target: './src/renderer/src/features', from: './src/renderer/src/pages' },
                        { target: './src/renderer/src/features', from: './src/renderer/src/widgets' },
                        { target: './src/renderer/src/entities', from: './src/renderer/src/app' },
                        { target: './src/renderer/src/entities', from: './src/renderer/src/pages' },
                        { target: './src/renderer/src/entities', from: './src/renderer/src/widgets' },
                        { target: './src/renderer/src/entities', from: './src/renderer/src/features' },
                        { target: './src/renderer/src/shared', from: './src/renderer/src/app' },
                        { target: './src/renderer/src/shared', from: './src/renderer/src/pages' },
                        { target: './src/renderer/src/shared', from: './src/renderer/src/widgets' },
                        { target: './src/renderer/src/shared', from: './src/renderer/src/features' },
                        { target: './src/renderer/src/shared', from: './src/renderer/src/entities' }
                    ]
                }
            ]
        },

        // 4. 경로 별칭(@) 인식을 위한 'settings' 추가
        settings: {
            'import/resolver': {
                typescript: {
                    project: './tsconfig.web.json'
                }
            }
        }
    }
]
