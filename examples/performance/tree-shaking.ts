// ❌ RUIM: Importa a biblioteca inteira
import _ from 'lodash'
_.debounce(fn, 300)

// ✅ BOM: Importa apenas a função
import debounce from 'lodash/debounce'
debounce(fn, 300)

// ❌ RUIM: Importa todos os ícones
import * as Icons from 'lucide-react'
<Icons.Search />

// ✅ BOM: Importa apenas o ícone usado
import { Search } from 'lucide-react'
<Search />

// ❌ RUIM: date-fns inteiro
import { format } from 'date-fns'

// ✅ BOM: apenas a função
import format from 'date-fns/format'
